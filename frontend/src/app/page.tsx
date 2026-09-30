'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ChatView } from '@/components/ChatView';
import { Language } from '@/lib/translations';
import { api } from '@/lib/api';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function Home() {
  const [language, setLanguage] = useState<Language>('en');
  const [sessionId, setSessionId] = useState<string>(() => generateUUID());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const res = await api.getHealth();
        if (isMounted) {
          setIsConnected(res.status === 'ok');
        }
      } catch {
        if (isMounted) {
          setIsConnected(false);
        }
      }
    };

    // Initial check
    checkHealth();

    const interval = setInterval(checkHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleNewChat = () => {
    if (sessionId) {
      api.deleteSession(sessionId).catch(() => {});
    }
    setSessionId(generateUUID());
  };

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-[100dvh] bg-white text-slate-900 flex flex-col antialiased"
    >
      {/* Clean Minimal Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        onNewChat={handleNewChat}
        isConnected={isConnected}
      />

      {/* Main Single Chat Experience */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ChatView
          key={sessionId}
          language={language}
          sessionId={sessionId}
        />
      </main>
    </div>
  );
}
