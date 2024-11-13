import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { ConversationService } from '@/services/conversationService';
import type { Message, DatabaseMessage } from '@/types/conversation';

export const useAIGeneration = () => {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState('groq');
  const [generatedContent, setGeneratedContent] = useState('');
  const conversationService = new ConversationService();

  const getModelDisplayName = (modelId: string) => {
    const modelMap: { [key: string]: string } = {
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'groq': 'Llama 3.2 90B',
      'open-mistral-nemo': 'Open Mistral Nemo',
      'mistral-large': 'Mistral Large',
      'xai': 'Grok',
      'openai/gpt-4o-mini': 'GPT-4o Mini',
      'google/gemma-2-9b-it:free': 'Gemma 2 9B',
      'anthropic/claude-3.5-sonnet:beta': 'Claude 3.5'
    };
    return modelMap[modelId] || modelId;
  };

  const buildContextualPrompt = async (newPrompt: string) => {
    try {
      const recentMessages = await conversationService.getRecentConversations(5);
      
      const context = recentMessages
        .reverse()
        .map((msg: Message | DatabaseMessage) => {
          if ('role' in msg) {
            return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
          } else if ('prompt' in msg) {
            return `User: ${msg.prompt}\nAssistant: ${msg.response}`;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n\n');

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
      // Check if the prompt is asking about model identity
      const isModelQuery = prompt.toLowerCase().includes('which model') || 
                          prompt.toLowerCase().includes('what model') ||
                          prompt.toLowerCase().includes('who are you');

      const contextualPrompt = await buildContextualPrompt(prompt);
      
      const options = {
        maxTokens: 4096,
        temperature: 0.7,
        topP: 0.4
      };

      // Store the current model to ensure consistency
      const currentModel = selectedModel;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: currentModel,
          prompt: contextualPrompt,
          options,
          isModelQuery // Pass this to the API
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();

      if (data.result) {
        let finalResponse = data.result;

        // Add model identity if needed
        if (isModelQuery) {
          const modelName = getModelDisplayName(currentModel);
          finalResponse = `I am ${modelName}, an AI language model. ${finalResponse}`;
        }

        // Save the conversation after successful generation
        await conversationService.saveConversation(prompt, finalResponse);
        setGeneratedContent(finalResponse);
        return finalResponse;
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

  // Persist model selection in localStorage
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    try {
      localStorage.setItem('selectedModel', model);
    } catch (error) {
      console.error('Error saving model preference:', error);
    }
  };

  // Load saved model preference on initialization
  useState(() => {
    try {
      const savedModel = localStorage.getItem('selectedModel');
      if (savedModel) {
        setSelectedModel(savedModel);
      }
    } catch (error) {
      console.error('Error loading model preference:', error);
    }
  });

  return {
    selectedModel,
    setSelectedModel: handleModelChange, // Use the new handler instead of direct setState
    generatedContent,
    generateContent
  };
}; 