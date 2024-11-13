import React from "react";
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';
import { useAIGeneration } from '../components/logic-ai-generation';

const AiChat: React.FC = () => {
  const { selectedModel, setSelectedModel, generateContent } = useAIGeneration();
  const location = useLocation();
  const sessionId = new URLSearchParams(location.search).get('session');

  return (
    <div className="flex min-h-screen overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 transition-colors duration-500">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ height: '100vh' }}>
        <main className="flex-1 flex flex-col h-auto w-auto overflow-hidden">
          <ChatInterface 
            generateContent={generateContent}
            defaultMessage="Welcome to AI Chat! I'm here to help answer your questions and assist with any tasks. What would you like to discuss?"
            sessionId={sessionId}
            onModelChange={(model: string) => setSelectedModel(model)}
          />
        </main>
      </div>
    </div>
  );
};

export default AiChat; 