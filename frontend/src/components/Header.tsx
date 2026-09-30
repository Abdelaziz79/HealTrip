'use client';

import React from 'react';
import { HeartPulse, Plus } from 'lucide-react';
import { Language, translations } from '@/lib/translations';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onNewChat: () => void;
  isConnected: boolean;
}

export function Header({
  language,
  onLanguageChange,
  onNewChat,
  isConnected,
}: HeaderProps) {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-2xs">
            <HeartPulse className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-sans">
                HealTrip
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-normal hidden md:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Status Indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-600"
            title={isConnected ? t.status.connected : t.status.disconnected}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
            <span className="hidden md:inline text-[11px]">
              {isConnected ? t.status.connected : t.status.disconnected}
            </span>
          </div>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
            title={t.chat.newChat}
          >
            <Plus className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">{t.chat.newChat}</span>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] sm:text-xs ${
                language === 'en'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('ar')}
              className={`px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer font-sans text-[11px] sm:text-xs ${
                language === 'ar'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              عربي
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
