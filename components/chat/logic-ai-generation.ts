import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { ConversationService, ChatMessage } from '@/services/conversationService';

interface UseAIGenerationProps {
  conversationService?: ConversationService;
  defaultModel?: string;
}

export const useAIGeneration = (props?: UseAIGenerationProps) => {
  const { 
    conversationService = new ConversationService(), 
    defaultModel = 'groq' 
  } = props || {};
  
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [generatedContent, setGeneratedContent] = useState('');

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
      // Get the current session ID from the conversation service
      const currentSessionId = conversationService.getSessionId();
      
      // Load messages from current session instead of recent conversations
      const sessionMessages = await conversationService.loadChatSession(currentSessionId);
      
      // Take last 5 messages for context
      const recentMessages = sessionMessages.slice(-5);

      const context = recentMessages
        .map((msg: ChatMessage) => {
          return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
        })
        .join('\n\n');

      const contextualPrompt = context ? `
You are an AI assistant having a conversation. Here is the relevant context from our current discussion:

${context}

Current request: ${newPrompt}

Important instructions:
1. Use the context above only if it's directly relevant to the current request
2. If the user is asking about modifying or referring to something from our conversation, use the context to understand what they're referring to
3. If the current request is starting a new topic, feel free to ignore the previous context
4. Keep your response focused and relevant to the current request
5. If you're unsure whether the context is relevant, prioritize responding to the current request directly

Please provide an appropriate response.` : newPrompt;

      return contextualPrompt;
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
          isModelQuery
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
    setSelectedModel: handleModelChange,
    generatedContent,
    generateContent
  };
}; 