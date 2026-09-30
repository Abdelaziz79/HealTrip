'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Database, CheckCircle2, Terminal } from 'lucide-react';
import { ToolCallResult } from '@/types';
import { Language, translations } from '@/lib/translations';

interface ToolCallsInspectorProps {
  toolsUsed: ToolCallResult[];
  language: Language;
}

export function ToolCallsInspector({ toolsUsed, language }: ToolCallsInspectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[language];

  if (!toolsUsed || toolsUsed.length === 0) return null;

  return (
    <div className="mt-3 border-t border-slate-200/60 pt-2.5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-1"
      >
        <Database className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
        <span className="font-semibold text-slate-700">
          {t.chat.toolsUsed} ({toolsUsed.length})
        </span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-2.5 w-2.5" />
          <span>Verified</span>
        </span>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div
          dir="ltr"
          className="mt-2 text-left space-y-2.5 rounded-xl bg-slate-900 text-slate-100 p-2.5 sm:p-3.5 text-[10px] sm:text-[11px] font-mono shadow-inner border border-slate-800 max-w-full overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-1 pb-1.5 border-b border-slate-800 text-[9px] sm:text-[10px] text-slate-400 font-sans">
            <span className="flex items-center gap-1.5 text-teal-400 font-medium">
              <Terminal className="h-3 w-3 flex-shrink-0" />
              <span>Tool Execution Audit ({toolsUsed.length})</span>
            </span>
            <span className="text-[9px] text-slate-500">Deterministic TypeScript Store</span>
          </div>

          {toolsUsed.map((tool, idx) => (
            <div
              key={idx}
              className="space-y-1.5 pb-2.5 border-b border-slate-800/80 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-teal-300 font-semibold text-xs tracking-wide truncate">
                  {tool.toolName}
                  <span className="text-slate-400">()</span>
                </span>
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  executed
                </span>
              </div>

              {/* Arguments JSON */}
              {tool.args && Object.keys(tool.args).length > 0 ? (
                <div>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block mb-0.5">Parameters:</span>
                  <pre className="text-emerald-400 bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-[9.5px] sm:text-[10.5px] overflow-x-auto max-w-full leading-relaxed">
                    {JSON.stringify(tool.args, null, 2)}
                  </pre>
                </div>
              ) : null}

              {/* Result Summary */}
              {tool.result !== undefined && tool.result !== null ? (
                <div className="pt-0.5">
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block mb-0.5">Result:</span>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-[9.5px] sm:text-[10px] text-slate-300 max-h-36 overflow-y-auto overflow-x-auto max-w-full leading-relaxed">
                    {typeof tool.result === 'object' ? (
                      <pre className="text-slate-300 font-mono">
                        {JSON.stringify(tool.result, null, 2)}
                      </pre>
                    ) : (
                      <span>{String(tool.result)}</span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

