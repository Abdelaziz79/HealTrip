import { Content, Part } from '@google/generative-ai';
import { geminiPool } from './gemini-pool';
import { agentTools } from './tools';
import { toolExecutor } from './tool-executor';
import { getSystemPrompt } from './system-prompt';
import { sessionService } from '../session.service';
import { ChatRequest, ChatResponse, ToolCallResult, ConversationMessage, UrgencyLevel } from '../../types';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/apiResponse';

const CONTEXT = 'AIAgent';
const MAX_TOOL_ITERATIONS = 5; // Prevent infinite tool-calling loops

/**
 * AI Agent orchestrator.
 *
 * Handles the full conversation loop:
 * 1. Build conversation context from session history
 * 2. Send to Gemini with tool definitions
 * 3. If Gemini returns function calls → execute tools → send results back
 * 4. Repeat until Gemini returns a text response
 * 5. Save messages to session
 */
export class AIAgent {
  /**
   * Process a chat message and return the AI response.
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { message, sessionId, language } = request;

    // Detect language: if message contains Arabic script, prioritize 'ar'
    const containsArabic = /[\u0600-\u06FF]/.test(message);
    const lang = containsArabic ? 'ar' : (language || 'en');

    // Get or create session
    const session = sessionService.getOrCreateSession(sessionId, lang);
    session.language = lang;

    logger.info(CONTEXT, `Processing message for session ${session.id}`, { language: lang });

    // Add user message to session
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    sessionService.addMessage(session.id, userMessage);

    // Build conversation contents for Gemini
    const contents = this.buildContents(session.messages);
    const systemPrompt = getSystemPrompt(lang);

    // Run the agent loop (handles tool calling)
    const { responseText, toolsUsed, urgencyLevel } = await this.runAgentLoop(
      systemPrompt,
      contents
    );

    // Sanitize any rogue English intro phrases when in Arabic mode
    const finalResponseText = lang === 'ar' ? this.sanitizeArabicResponse(responseText) : responseText;

    // Save AI response to session
    const aiMessage: ConversationMessage = {
      role: 'model',
      content: finalResponseText,
      toolCalls: toolsUsed,
      timestamp: Date.now(),
    };
    sessionService.addMessage(session.id, aiMessage);

    // Update session urgency if assessed
    if (urgencyLevel) {
      session.urgencyLevel = urgencyLevel as UrgencyLevel;
    }

    return {
      sessionId: session.id,
      message: finalResponseText,
      toolsUsed,
      urgencyLevel: (urgencyLevel as UrgencyLevel) || session.urgencyLevel,
    };
  }

  /**
   * Sanitize responses for Arabic users:
   * 1. Strip any leaked internal thought / reasoning / planning English text
   * 2. Strip <thought> tags
   * 3. Translate rogue tool-intro phrases into clean Arabic
   */
  private sanitizeArabicResponse(text: string): string {
    // 1. Strip <thought>...</thought> tags if present
    let cleaned = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();

    // 2. Check if the response contains Arabic text, and if so, strip any leading English reasoning / planning blocks
    // Models sometimes leak chain-of-thought like:
    // "The urgency assessment indicates... Now I need to determine... Therefore, my response should..."
    const firstArabicIdx = cleaned.search(/[\u0600-\u06FF]/);
    if (firstArabicIdx > 0) {
      const leadingText = cleaned.substring(0, firstArabicIdx).trim();
      const isInternalPlanning =
        /(?:urgency|reasoning|assessment|specialty|search_doctors|response should|I will|I need to|let me|now I|therefore)/i.test(
          leadingText
        );
      if (isInternalPlanning) {
        logger.warn(CONTEXT, 'Stripped leaked model chain-of-thought from Arabic response');
        cleaned = cleaned.substring(firstArabicIdx).trim();
      }
    }

    // 3. Clean up rogue English intro phrases
    cleaned = cleaned
      .replace(/(?:^|\n)\s*(?:[:\s-]*)?I found one doctor matching your criteria:?\s*/gi, '\n\nتم العثور على طبيب متخصص يطابق معاييرك:\n\n')
      .replace(/(?:^|\n)\s*(?:[:\s-]*)?I found (\d+) doctors matching your criteria:?\s*/gi, '\n\nتم العثور على $1 أطباء يطابقون معاييرك:\n\n')
      .replace(/(?:^|\n)\s*(?:[:\s-]*)?Here are the doctors matching your (?:criteria|search):?\s*/gi, '\n\nإليك الأطباء المطابقون لمعايير البحث:\n\n')
      .replace(/(?:^|\n)\s*(?:[:\s-]*)?Here is the doctor matching your (?:criteria|search):?\s*/gi, '\n\nإليك الطبيب المطابق لمعايير البحث:\n\n')
      .replace(/(?:^|\n)\s*(?:[:\s-]*)?I found one hospital matching your criteria:?\s*/gi, '\n\nتم العثور على مستشفى واحد يطابق معاييرك:\n\n')
      .replace(/(?:^|\n)\s*(?:[:\s-]*)?I found (\d+) hospitals matching your criteria:?\s*/gi, '\n\nتم العثور على $1 مستشفيات تطابق معاييرك:\n\n')
      .replace(/(?:^|\n)\s*(?:[:\s-]*)?Based on your criteria,?\s*:?\s*/gi, '\n\nبناءً على معايير البحث:\n\n')
      .trim();

    return cleaned;
  }

  /**
   * Build Gemini Content[] from conversation history.
   * Ensures alternating 'user' and 'model' turns as strictly required by Gemini API.
   */
  private buildContents(messages: ConversationMessage[]): Content[] {
    const valid = messages.filter((m) => m.content && m.content.trim().length > 0);
    if (valid.length === 0) return [];

    const merged: Content[] = [];

    for (const msg of valid) {
      const role: 'user' | 'model' = msg.role === 'model' || (msg.role as string) === 'assistant' ? 'model' : 'user';
      const text = msg.content.trim();

      if (merged.length > 0 && merged[merged.length - 1].role === role) {
        // Merge consecutive messages of identical role
        const lastParts = merged[merged.length - 1].parts as any[];
        if (lastParts[0] && 'text' in lastParts[0]) {
          lastParts[0].text += `\n\n${text}`;
        } else {
          lastParts.push({ text });
        }
      } else {
        merged.push({
          role,
          parts: [{ text }] as Part[],
        });
      }
    }

    // Ensure the conversation begins with 'user'
    while (merged.length > 0 && merged[0].role !== 'user') {
      merged.shift();
    }

    return merged;
  }

  /**
   * Run the agent loop: send to Gemini, handle tool calls, repeat.
   */
  private async runAgentLoop(
    systemPrompt: string,
    contents: Content[]
  ): Promise<{
    responseText: string;
    toolsUsed: ToolCallResult[];
    urgencyLevel?: string;
  }> {
    const allToolsUsed: ToolCallResult[] = [];
    let currentContents = [...contents];
    let urgencyLevel: string | undefined;
    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;
      logger.debug(CONTEXT, `Agent loop iteration ${iterations}`);

      const { response, modelUsed } = await geminiPool.generateContent(
        systemPrompt,
        currentContents,
        agentTools
      );

      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts) {
        throw new AppError('Empty response from AI model', 500, 'AI_EMPTY_RESPONSE');
      }

      const parts = candidate.content.parts;

      // Check for function calls
      const functionCalls = parts.filter(
        (part: Part) => 'functionCall' in part && part.functionCall
      );

      if (functionCalls.length === 0) {
        // No function calls — extract text response, strictly ignoring internal thought parts
        const textParts = parts
          .filter(
            (part: Part) =>
              'text' in part &&
              Boolean(part.text) &&
              !(part as any).thought &&
              !(part as any).isThought
          )
          .map((part: Part) => (part as { text: string }).text);

        const responseText = textParts.join('\n').trim();

        if (!responseText) {
          throw new AppError('AI returned empty text response', 500, 'AI_EMPTY_TEXT');
        }

        logger.info(CONTEXT, `Agent completed in ${iterations} iteration(s) with ${allToolsUsed.length} tool call(s). Model: ${modelUsed}`);

        return { responseText, toolsUsed: allToolsUsed, urgencyLevel };
      }

      // Execute tool calls
      logger.info(CONTEXT, `Model requested ${functionCalls.length} tool call(s)`);

      // Add model's response (with function calls) to conversation
      currentContents.push({
        role: 'model',
        parts: parts,
      });

      // Execute each function call and build function response parts
      const functionResponseParts: Part[] = [];

      for (const part of functionCalls) {
        const fc = (part as any).functionCall;
        const toolName = fc.name;
        const toolArgs = fc.args || {};

        const toolResult = toolExecutor.execute(toolName, toolArgs);
        allToolsUsed.push(toolResult);

        // Track urgency level if assessed
        if (toolName === 'assess_urgency' && toolResult.result) {
          const assessment = toolResult.result as { level?: string };
          if (assessment.level) {
            urgencyLevel = assessment.level;
          }
        }

        functionResponseParts.push({
          functionResponse: {
            name: toolName,
            response: { result: toolResult.result },
          },
        } as Part);
      }

      // Add function responses to conversation
      currentContents.push({
        role: 'user',
        parts: functionResponseParts,
      });
    }

    // If we hit max iterations, something is wrong
    logger.warn(CONTEXT, `Agent hit max iterations (${MAX_TOOL_ITERATIONS})`);
    throw new AppError(
      'AI agent exceeded maximum tool-calling iterations. Please try rephrasing your question.',
      500,
      'AI_MAX_ITERATIONS'
    );
  }
}

export const aiAgent = new AIAgent();
