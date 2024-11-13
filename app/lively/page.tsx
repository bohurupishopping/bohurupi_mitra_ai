"use client";

import { useState } from 'react';
import LivelyChatInterface from '@/components/lively/LivelyChatInterface';
import Sidebar from '@/components/shared/Sidebar';

export default function LivelyPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <main className="flex-1 overflow-hidden">
        <LivelyChatInterface 
          defaultMessage="# Welcome to Lively! 👋\n\nI'm powered by Gemini Pro with real-time information grounding. Ask me anything about current events, news, or any topic you'd like to explore!" 
        />
      </main>
    </div>
  );
} 