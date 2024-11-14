"use client";

import { useState, Suspense } from 'react';
import LivelyChatInterface from '@/components/lively/LivelyChatInterface';
import Sidebar from '@/components/shared/Sidebar';
import { Loader2 } from 'lucide-react';

// Create a loading component
function LoadingFallback() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
}

// Wrap the main content in a separate component
function LivelyContent() {
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

// Main page component with Suspense boundary
export default function LivelyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LivelyContent />
    </Suspense>
  );
} 