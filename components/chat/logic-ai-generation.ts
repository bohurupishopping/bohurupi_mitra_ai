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
  const [isExpanded, setIsExpanded] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [paragraphs, setParagraphs] = useState<string[]>([]);

  const getModelDisplayName = (modelId: string) => {
    const modelMap: { [key: string]: string } = {
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'groq': 'Llama 3.2 90B',
      'open-mistral-nemo': 'Open Mistral Nemo',
      'mistral-large': 'Mistral Large',
      'xai': 'Grok',
      'nousresearch/hermes-3-llama-3.1-405b:free': 'Hermes 3 405B',
      'meta-llama/llama-3.1-70b-instruct:free': 'Llama 3.1 70B'
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

  const processStreamedText = (text: string) => {
    // Split text into paragraphs
    const parts = text.split(/\n\n+/);
    return parts.filter(p => p.trim().length > 0);
  };

  const generateContent = useCallback(async (prompt: string) => {
    try {
      const contextualPrompt = await buildContextualPrompt(prompt);
      const modelToUse = selectedModel;
      
      // Handle streaming for Hermes model
      if (modelToUse === 'nousresearch/hermes-3-llama-3.1-405b:free') {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({
            model: modelToUse,
            prompt: contextualPrompt,
            options: {
              maxTokens: 4096,
              temperature: 0.7,
              topP: 0.4
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Stream generation failed');
        }
        
        if (!response.body) throw new Error('No response body available');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let accumulatedText = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  accumulatedText = data.accumulated;
                  const newParagraphs = processStreamedText(accumulatedText);
                  setParagraphs(newParagraphs);
                  setStreamedContent(accumulatedText);
                  
                  if (data.done) {
                    await conversationService.saveConversation(prompt, accumulatedText);
                    setGeneratedContent(accumulatedText);
                    return accumulatedText;
                  }
                } catch (e) {
                  console.error('Error parsing streaming data:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          throw error;
        } finally {
          reader.releaseLock();
        }
      }
      
      // Check if the prompt is asking about model identity
      const isModelQuery = prompt.toLowerCase().includes('which model') || 
                          prompt.toLowerCase().includes('what model') ||
                          prompt.toLowerCase().includes('who are you');

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
          model: modelToUse,
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
          const modelName = getModelDisplayName(modelToUse);
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
  }, [selectedModel, toast, conversationService]);

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
    generateContent,
    streamedContent,
    paragraphs,
    isExpanded,
    setIsExpanded
  };
}; 