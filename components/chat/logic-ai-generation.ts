import { useState, useCallback } from 'react';
import OpenAI from 'openai';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai/dist';
import { createMistral } from '@ai-sdk/mistral/dist';
import { createGroq } from '@ai-sdk/groq/dist';
import { useToast } from "@/components/ui/use-toast";
import { generateChatResponse, ChatOptions } from '@/services/chatService';

// X.AI Provider Configuration
const xai = createOpenAI({
  name: 'xai',
  baseURL: 'https://api.x.ai/v1',
  apiKey: process.env.NEXT_PUBLIC_XAI_API_KEY ?? '',
});

// OpenRouter OpenAI Client
const openRouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.NEXT_PUBLIC_OPEN_ROUTER_API_KEY || 'dummy-key',
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : '',
    "X-Title": "Creative Scribe",
  }
});

// Initialize Together AI client
const togetherClient = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_TOGETHER_API_KEY || '',
  baseURL: 'https://api.together.xyz/v1',
  dangerouslyAllowBrowser: true
});

// Initialize providers
const mistralClient = createMistral({
  apiKey: process.env.NEXT_PUBLIC_MISTRAL_API_KEY || ''
});

const groqClient = createGroq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || ''
});

export const useAIGeneration = () => {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState('groq');
  const [generatedContent, setGeneratedContent] = useState('');

  const generateContent = useCallback(async (prompt: string) => {
    try {
      let result;
      const options: ChatOptions = {
        model: selectedModel,
        maxTokens: 4096,
        temperature: 0.7,
        topP: 0.4
      };

      // Check if it's a Together AI model
      if (selectedModel.startsWith('together/')) {
        const modelName = selectedModel.replace('together/', '');
        const response = await togetherClient.chat.completions.create({
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096,
          temperature: 0.7,
          top_p: 0.4
        });

        result = response.choices[0]?.message?.content;
      } else {
        // Handle different models using chatService
        let modelInstance;
        switch (selectedModel) {
          case 'open-mistral-nemo':
            modelInstance = mistralClient('open-mistral-nemo');
            break;
          case 'mistral-large':
            modelInstance = mistralClient('mistral-large-2407');
            break;
          case 'groq':
            modelInstance = groqClient('llama-3.2-90b-vision-preview');
            break;
          default:
            throw new Error('Invalid model selected');
        }

        result = await generateChatResponse(prompt, options, modelInstance);
      }

      if (result) {
        setGeneratedContent(result);
        return result;
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