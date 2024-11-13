"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';
import Sidebar from '@/components/chat/Sidebar';
import { useAIGeneration } from '@/components/chat/logic-ai-generation';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const { setSelectedModel } = useAIGeneration();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50/50 to-pink-50/50">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      <main className="flex-1 overflow-hidden">
        <ChatInterface 
          sessionId={sessionId || undefined}
          onModelChange={setSelectedModel}
        />
      </main>
    </div>
  );
}