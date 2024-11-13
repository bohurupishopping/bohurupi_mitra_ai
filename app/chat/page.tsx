"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';
import Sidebar from '@/components/chat/Sidebar';
import { useAIGeneration } from '@/components/chat/logic-ai-generation';
import { useEffect, useState } from 'react';

// Create a client component for the chat content
function ChatContent() {
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

// Create a loading component
function LoadingChat() {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50/50 to-pink-50/50">
      <div className="animate-pulse text-gray-500">Loading chat...</div>
    </div>
  );
}

// Export the main page component with Suspense
export default function ChatPage() {
  return (
    <Suspense fallback={<LoadingChat />}>
      <ChatContent />
    </Suspense>
  );
}