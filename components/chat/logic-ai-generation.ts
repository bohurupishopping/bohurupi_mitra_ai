import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { ConversationService, ChatMessage } from '@/services/conversationService';

interface UseAIGenerationProps {
  conversationService?: ConversationService;
  defaultModel?: string;
}

const getMaxTokens = (model: string) => {
  if (model === 'gemini-1.5-pro') {
    return 1000000;
  }
  if (model === 'gemini-1.5-flash') {
    return 128000;
  }
  if (model.includes('llama-3.2-90b')) {
    return 8192;
  }
  if (model.includes('llama-3.2-11b')) {
    return 8192;
  }
  if (model === 'pixtral-large-latest') {
    return 128000;
  }
  return 8192; // default for other models
};

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
    if (modelId.startsWith('llama-')) {
      return modelId
        .replace('llama-', 'Llama ')
        .replace('-vision-preview', ' Vision')
        .replace('-versatile', ' Versatile');
    }
    if (modelId.startsWith('gemini-')) {
      return `Gemini ${modelId.split('gemini-')[1]}`;
    }
    const modelMap: { [key: string]: string } = {
      'open-mistral-nemo': 'Open Mistral Nemo',
      'pixtral-large-latest': 'Pixtral Large',
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
      
      // For Gemini models
      if (modelToUse.startsWith('gemini-')) {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelToUse,
            prompt: contextualPrompt,
            options: {
              maxTokens: getMaxTokens(modelToUse),
              temperature: 1,
              topP: 0.95
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate content');
        }

        const data = await response.json();
        
        if (!data.result) {
          throw new Error('No content generated');
        }

        await conversationService.saveConversation(prompt, data.result);
        setGeneratedContent(data.result);
        return data.result;
      }
      // For Groq models
      else if (modelToUse.startsWith('llama-') || modelToUse === 'groq') {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelToUse,
            prompt: contextualPrompt,
            options: {
              maxTokens: getMaxTokens(modelToUse),
              temperature: 0.7,
              topP: 0.4
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate content');
        }

        const data = await response.json();
        
        if (data.result) {
          let finalResponse = data.result;

          // Check for truncated response
          if (finalResponse.endsWith('...') || finalResponse.endsWith('…')) {
            console.warn('Response appears to be truncated, consider increasing context window');
          }

          await conversationService.saveConversation(prompt, finalResponse);
          setGeneratedContent(finalResponse);
          return finalResponse;
        }

        throw new Error('No content generated');
      }
      
      // For other models
      const isModelQuery = prompt.toLowerCase().includes('which model') || 
                          prompt.toLowerCase().includes('what model') ||
                          prompt.toLowerCase().includes('who are you');

      const options = {
        maxTokens: getMaxTokens(modelToUse),
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data = await response.json();

      if (data.result) {
        let finalResponse = data.result;

        // Check for truncated response
        if (finalResponse.endsWith('...') || finalResponse.endsWith('…')) {
          console.warn('Response appears to be truncated, consider increasing context window');
        }

        if (isModelQuery) {
          const modelName = getModelDisplayName(modelToUse);
          finalResponse = `I am ${modelName}, an AI language model. ${finalResponse}`;
        }

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