import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { ConversationService } from '@/services/conversationService';
import type { Message, DatabaseMessage } from '@/types/conversation';

export const useAIGeneration = () => {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState('groq');
  const [generatedContent, setGeneratedContent] = useState('');
  const conversationService = new ConversationService();

  const buildContextualPrompt = async (newPrompt: string) => {
    try {
      // Get recent conversations from the database
      const recentMessages = await conversationService.getRecentConversations(5);
      
      // Format the conversation history
      const context = recentMessages
        .reverse()
        .map((msg: Message | DatabaseMessage) => {
          if ('role' in msg) {
            // For messages with role property (Message type)
            return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
          } else if ('prompt' in msg) {
            // For messages from database (DatabaseMessage type)
            return `User: ${msg.prompt}\nAssistant: ${msg.response}`;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n\n');

      // Build the final prompt with context
      const contextualPrompt = `
Previous conversation history:
${context}

Current request: ${newPrompt}

Based on our previous conversation, please provide an appropriate response. If I'm asking to modify something from our previous interaction, please refer to that and make the requested changes.`;

      return context ? contextualPrompt : newPrompt;
    } catch (error) {
      console.error('Error building contextual prompt:', error);
      return newPrompt;
    }
  };

  const generateContent = useCallback(async (prompt: string) => {
    try {
      // Get contextual prompt
      const contextualPrompt = await buildContextualPrompt(prompt);
      
      const options = {
        maxTokens: 4096,
        temperature: 0.7,
        topP: 0.4
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: contextualPrompt,
          options
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();

      if (data.result) {
        // Save the conversation after successful generation
        await conversationService.saveConversation(prompt, data.result);
        setGeneratedContent(data.result);
        return data.result;
      }

      throw new Error('No content generated');
    } catch (error) {
      console.error('Content generation error:', error);
      toast({
        title: 'Generation Error',
        description: `Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
      return null;
    }
  }, [selectedModel, toast]);

  return {
    selectedModel,
    setSelectedModel,
    generatedContent,
    generateContent
  };
}; 