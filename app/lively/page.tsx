"use client";

import { useState, Suspense } from 'react';
import LivelyChatInterface from '@/components/lively/LivelyChatInterface';
import Sidebar from '@/components/shared/Sidebar';
import { Loader2 } from 'lucide-react';

// Create a wrapped Sidebar component
function SidebarWithSuspense({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <Suspense fallback={
      <div className="w-[240px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    }>
      <Sidebar isOpen={isOpen} onToggle={onToggle} />
    </Suspense>
  );
}

export default function LivelyPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarWithSuspense 
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