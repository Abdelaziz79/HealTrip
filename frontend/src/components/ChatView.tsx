'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowUp,
  Bot,
  User,
  Stethoscope,
  Building,
  HeartPulse,
  Square,
} from 'lucide-react';
import { DoctorCard } from './DoctorCard';
import { HospitalCard } from './HospitalCard';
import { ToolCallsInspector } from './ToolCallsInspector';
import { ChatMessage, Doctor, Hospital, ToolCallResult, UrgencyLevel } from '@/types';
import { Language, translations } from '@/lib/translations';
import { api } from '@/lib/api';

let messageCounter = 0;
const getTimestamp = () => Date.now();
const generateId = (prefix: string) => {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
};

interface ChatViewProps {
  language: Language;
  sessionId: string;
}

export function ChatView({ language, sessionId }: ChatViewProps) {
  const t = translations[language];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(sessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopStreamingRef = useRef<(() => void) | null>(null);


  // Clean up streaming on unmount
  useEffect(() => {
    return () => {
      if (stopStreamingRef.current) {
        stopStreamingRef.current();
      }
    };
  }, []);

  // Auto-scroll on new message or loading change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  const handleStopStreaming = () => {
    if (stopStreamingRef.current) {
      stopStreamingRef.current();
    }
  };

  const handleSend = async (textToSend?: string) => {
    // If currently streaming, stop and reveal immediately
    if (isStreaming && stopStreamingRef.current) {
      stopStreamingRef.current();
    }

    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId('usr'),
      role: 'user',
      content: text,
      timestamp: getTimestamp(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.sendMessage({
        message: text,
        sessionId: activeSessionId,
        language,
      });

      if (response.sessionId && response.sessionId !== activeSessionId) {
        setActiveSessionId(response.sessionId);
      }

      // Finish thinking state
      setIsLoading(false);

      const assistantId = generateId('ast');
      const fullText = response.message || '';

      // Tokenize by word + trailing whitespace for natural streaming
      const tokens = fullText.match(/\S+\s*|\s+/g) || [fullText];

      // Add assistant message initially with empty content
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: getTimestamp(),
        toolsUsed: response.toolsUsed,
        urgencyLevel: response.urgencyLevel,
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsStreaming(true);

      // Progressive typewriter streaming
      let currentIndex = 0;
      let accumulated = '';
      let isCancelled = false;
      let timerId: NodeJS.Timeout | null = null;

      const stopStream = () => {
        isCancelled = true;
        if (timerId) clearTimeout(timerId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: fullText, isStreaming: false }
              : m
          )
        );
        setIsStreaming(false);
        stopStreamingRef.current = null;
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      };

      stopStreamingRef.current = stopStream;

      const streamNextToken = () => {
        if (isCancelled) return;

        if (currentIndex >= tokens.length) {
          // Complete streaming
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: fullText, isStreaming: false }
                : m
            )
          );
          setIsStreaming(false);
          stopStreamingRef.current = null;
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          return;
        }

        const token = tokens[currentIndex];
        accumulated += token;
        currentIndex++;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: accumulated, isStreaming: true }
              : m
          )
        );

        // Smooth scroll periodically
        if (currentIndex % 2 === 0 || currentIndex === tokens.length) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }

        // Natural, comfortable reading delay (adjusted to be deliberate, not rushed)
        let delay = 42; // base ms per word
        if (tokens.length > 250) {
          delay = 28;
        } else if (tokens.length > 120) {
          delay = 35;
        }

        // Punctuation and newline pauses for authentic AI cadence
        if (token.endsWith('.') || token.endsWith('.\n') || token.endsWith('.\n\n')) {
          delay += 65;
        } else if (token.endsWith('?') || token.endsWith('!\n') || token.endsWith('!')) {
          delay += 65;
        } else if (token.endsWith(':') || token.endsWith(':\n')) {
          delay += 40;
        } else if (token.includes('\n\n')) {
          delay += 50;
        } else if (token.endsWith(',')) {
          delay += 30;
        }

        timerId = setTimeout(streamNextToken, delay);
      };

      // Start streaming
      timerId = setTimeout(streamNextToken, 25);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: generateId('err'),
        role: 'assistant',
        content:
          err instanceof Error
            ? `⚠️ ${err.message}`
            : 'Could not connect to the HealTrip AI service. Please ensure the backend is running.',
        timestamp: getTimestamp(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const extractProviders = (toolsUsed?: ToolCallResult[]) => {
    const doctors: Doctor[] = [];
    const hospitals: Hospital[] = [];

    if (!toolsUsed) return { doctors, hospitals };

    for (const tool of toolsUsed) {
      const res = tool.result as { doctors?: Doctor[]; hospitals?: Hospital[] } | undefined;
      if (tool.toolName === 'search_doctors' && res?.doctors) {
        doctors.push(...res.doctors);
      }
      if (tool.toolName === 'search_hospitals' && res?.hospitals) {
        hospitals.push(...res.hospitals);
      }
    }

    return { doctors, hospitals };
  };

  const getUrgencyBadgeStyle = (level?: UrgencyLevel) => {
    switch (level) {
      case 'emergency':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'urgent':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'routine':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'self_care':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-3xl w-full mx-auto px-2.5 sm:px-4 py-2 sm:py-4 h-full min-h-0">
      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-4 sm:space-y-6 overflow-y-auto pb-3 sm:pb-4 px-0.5 sm:px-1 min-h-0">
        {messages.length === 0 ? (
          <div className="pt-6 sm:pt-14 pb-6 text-center max-w-xl mx-auto px-2">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm">
              <HeartPulse className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
              {t.chat.welcomeTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 sm:mt-2 leading-relaxed">
              {t.chat.welcomeSubtitle}
            </p>

            {/* Quick Starters */}
            <div className="mt-6 sm:mt-8 text-start">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 sm:mb-3 text-center sm:text-start">
                {t.chat.startersTitle}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {t.chat.starters.map((starter, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(starter.query)}
                    className="p-2.5 sm:p-3 text-start rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 transition-all cursor-pointer shadow-2xs group"
                  >
                    <span className="font-semibold text-xs text-teal-800 block mb-0.5 group-hover:text-teal-900">
                      {starter.label}
                    </span>
                    <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 leading-snug">
                      &ldquo;{starter.query}&rdquo;
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const { doctors, hospitals } = extractProviders(msg.toolsUsed);

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end items-start gap-1.5 sm:gap-2.5 w-full">
                  <div
                    className={`bg-slate-900 text-white rounded-2xl ${
                      language === 'ar' ? 'rounded-tl-xs' : 'rounded-tr-xs'
                    } px-3.5 sm:px-4 py-2 sm:py-2.5 max-w-[88%] sm:max-w-[80%] text-xs sm:text-sm leading-relaxed shadow-xs`}
                  >
                    {msg.content}
                  </div>
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex justify-start items-start gap-1.5 sm:gap-2.5 w-full">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>

                <div
                  className={`flex-1 max-w-[92%] sm:max-w-[84%] rounded-2xl ${
                    language === 'ar' ? 'rounded-tr-xs' : 'rounded-tl-xs'
                  } px-3 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm leading-relaxed border shadow-xs ${
                    msg.error
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-slate-50 text-slate-800 border-slate-200/80'
                  }`}
                >
                  {/* Urgency Badge if present */}
                  {msg.urgencyLevel && (
                    <div className="mb-2.5 inline-flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wide uppercase ${getUrgencyBadgeStyle(msg.urgencyLevel)}`}>
                        {t.urgency[msg.urgencyLevel]}
                      </span>
                    </div>
                  )}

                  {/* Message Content with Markdown & GFM */}
                  <div
                    className={`text-sm leading-relaxed text-slate-800 break-words ${
                      msg.isStreaming ? 'streaming-cursor' : ''
                    }`}
                  >
                    {msg.content ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-outside ps-5 space-y-1.5 my-2.5">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-outside ps-5 space-y-1.5 my-2.5">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          strong: ({ children }) => (
                            <strong className="font-semibold text-slate-900">{children}</strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-slate-700">{children}</em>
                          ),
                          h1: ({ children }) => (
                            <h1 className="text-base font-bold text-slate-900 mt-3.5 mb-1.5">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-sm font-bold text-slate-900 mt-3 mb-1">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-xs font-bold text-slate-900 mt-2.5 mb-1">
                              {children}
                            </h3>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-s-3 border-teal-500 ps-3 py-1 my-2.5 text-slate-600 bg-slate-100/50 rounded-e-md italic">
                              {children}
                            </blockquote>
                          ),
                          pre: ({ children }) => (
                            <pre
                              dir="ltr"
                              className="text-left bg-slate-900 text-slate-100 p-3 rounded-xl text-xs font-mono overflow-x-auto my-2.5 border border-slate-800"
                            >
                              {children}
                            </pre>
                          ),
                          code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
                            const isBlock = Boolean(className);
                            if (isBlock) {
                              return (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <code
                                dir="ltr"
                                className="bg-slate-200/80 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono inline-block"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <span className="inline-block text-teal-600 animate-pulse text-sm">▋</span>
                    )}
                  </div>

                  {/* Embedded Recommended Doctors */}
                  {doctors.length > 0 && !msg.isStreaming && (
                    <div className="mt-4 pt-3 border-t border-slate-200/60">
                      <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                        <span>{t.chat.recommendedDoctors}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1.5">
                        {doctors.slice(0, 4).map((doc) => (
                          <DoctorCard key={doc.id} doctor={doc} language={language} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Embedded Recommended Hospitals */}
                  {hospitals.length > 0 && !msg.isStreaming && (
                    <div className="mt-4 pt-3 border-t border-slate-200/60">
                      <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-teal-600" />
                        <span>{t.chat.recommendedHospitals}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1.5">
                        {hospitals.slice(0, 2).map((hosp) => (
                          <HospitalCard key={hosp.id} hospital={hosp} language={language} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tool Calls Inspector */}
                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <ToolCallsInspector toolsUsed={msg.toolsUsed} language={language} />
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start items-start gap-2.5 w-full">
            <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div
              className={`px-4 py-3 rounded-2xl ${
                language === 'ar' ? 'rounded-tr-xs' : 'rounded-tl-xs'
              } bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2`}
            >
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-bounce" />
              </div>
              <span>{t.chat.thinking}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="pt-1.5 sm:pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center bg-white border border-slate-300 rounded-2xl shadow-sm focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/10 transition-all p-1 sm:p-1.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={t.chat.inputPlaceholder}
            className="flex-1 bg-transparent px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={handleStopStreaming}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-all cursor-pointer flex-shrink-0 shadow-xs"
              title={language === 'ar' ? 'إيقاف التوليد' : 'Stop generating'}
            >
              <Square className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex-shrink-0 shadow-xs"
            >
              <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}
        </form>

        <p className="text-[10px] sm:text-[11px] text-slate-400 text-center mt-1.5 sm:mt-2 leading-tight px-1">
          {t.chat.disclaimer}
        </p>
      </div>
    </div>
  );
}
