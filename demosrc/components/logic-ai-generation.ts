import { useState, useCallback } from 'react';
import OpenAI from 'openai';
import { generateText } from 'ai';

// Import AI SDK providers
import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';
import { createGroq } from '@ai-sdk/groq';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useToast } from "./use-toast";

// X.AI Provider Configuration
const xai = createOpenAI({
  name: 'xai',
  baseURL: 'https://api.x.ai/v1',
  apiKey: import.meta.env.VITE_XAI_API_KEY ?? '',
});

// OpenRouter OpenAI Client
const openRouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: import.meta.env.VITE_OPEN_ROUTER_API_KEY || 'dummy-key',
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    "HTTP-Referer": window.location.origin,
    "X-Title": "Creative Scribe",
  }
});

// Initialize Google AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || '');

// Initialize Together AI client
const togetherClient = new OpenAI({
  apiKey: import.meta.env.VITE_TOGETHER_API_KEY || '',
  baseURL: 'https://api.together.xyz/v1',
  dangerouslyAllowBrowser: true
});

// Update the formatAIResponse function
const formatAIResponse = (text: string): string => {
  try {
    let content = text;
    try {
      const jsonContent = JSON.parse(text);
      content = jsonContent.content || jsonContent.text || jsonContent.response || text;
    } catch {
      content = text;
    }

    // Process code blocks first (to prevent interference with other formatting)
    content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
      const languageClass = language ? ` language-${language}` : '';
      return `
        <div class="relative my-2">
          <pre class="relative bg-gray-100 rounded-md p-2 overflow-x-auto">
            <div class="flex justify-between items-center mb-1">
              ${language ? 
                `<span class="text-xs font-medium text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded">${language}</span>` : 
                ''}
              <button class="copy-button opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded">
                Copy
              </button>
            </div>
            <code class="block text-sm font-mono${languageClass} text-gray-800">${
              code.trim()
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
            }</code>
          </pre>
        </div>`;
    });
    
    

    // Process inline code
    content = content.replace(/`([^`]+)`/g, 
      '<code class="px-1.5 py-0.5 mx-0.5 rounded bg-gray-100 text-sm font-mono text-blue-600">$1</code>'
    );

    // Process headings with proper spacing and styling
    content = content
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2 text-gray-800 tracking-tight">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-3 mb-2 text-gray-700 tracking-tight">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mt-2 mb-1.5 text-gray-600 tracking-tight">$1</h3>');

    // Process text styling with improved visual hierarchy
    content = content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>')
      .replace(/__(.*?)__/g, '<u class="underline decoration-blue-500/30 decoration-2">$1</u>')
      .replace(/~~(.*?)~~/g, '<del class="line-through text-gray-500">$1</del>');

    // Process lists with better spacing and bullets
    content = content
      .replace(/^\- (.*$)/gm, 
        '<li class="flex items-start space-x-2 my-0.5 text-gray-700">' +
        '<span class="text-blue-500 mt-1.5">•</span>' +
        '<span>$1</span></li>'
      )
      .replace(/^\d\. (.*$)/gm, 
        '<li class="flex items-start space-x-2 my-0.5 text-gray-700 pl-1">' +
        '<span class="text-blue-500 font-medium mr-2">$1.</span>' +
        '<span>$2</span></li>'
      );

    // Wrap lists in proper containers
    content = content
      .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="my-2 space-y-1">$1</ul>');

    // Process blockquotes with enhanced styling
    content = content.replace(/^> (.*$)/gm, 
      '<blockquote class="border-l-4 border-blue-500/30 pl-4 py-0.5 my-2 text-gray-600 ' +
      'bg-gradient-to-r from-blue-50/50 to-transparent rounded-r-lg">$1</blockquote>'
    );

    // Process tables if present
    content = content.replace(
      /\|(.+)\|/g,
      '<div class="overflow-x-auto my-3">' +
      '<table class="min-w-full divide-y divide-gray-200 border border-gray-200/50 rounded-lg">' +
      '<tbody class="divide-y divide-gray-200 bg-white">$1</tbody>' +
      '</table></div>'
    );

    // Process paragraphs with optimized spacing
    const paragraphs = content
      .split(/\n\n+/)
      .filter(para => para.trim() !== '');

    content = paragraphs
      .map(para => {
        if (para.trim().startsWith('<')) return para;
        return `<p class="text-gray-700 leading-relaxed my-1.5 tracking-wide">${para.trim()}</p>`;
      })
      .join('\n');

    // Add special callouts for important information
    content = content.replace(/!!! (info|warning|tip) (.*$)/gm, (_, type, text) => {
      const colors = {
        info: 'blue',
        warning: 'yellow',
        tip: 'green'
      };
      const color = colors[type as keyof typeof colors];
      
      return `
        <div class="my-3 p-3 bg-${color}-50/50 border border-${color}-200/50 rounded-lg">
          <div class="flex items-center gap-2 text-${color}-700">
            <span class="font-medium">${type.charAt(0).toUpperCase() + type.slice(1)}:</span>
            <span>${text}</span>
          </div>
        </div>
      `;
    });

    // Clean up any excessive spacing
    content = content
      .replace(/\n{3,}/g, '\n\n')
      .replace(/(<\/p>)\s*(<p)/g, '$1$2')
      .replace(/(<\/div>)\s*(<div)/g, '$1$2')
      .replace(/(<\/pre>)\s*(<pre)/g, '$1$2');

    return content;

  } catch (error) {
    console.error('Error formatting AI response:', error);
    return text;
  }
};

export const useAIGeneration = () => {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState('groq');
  const [generatedContent, setGeneratedContent] = useState('');

  // Update the generateContent function to use the new formatter
  const generateContent = useCallback(async (prompt: string) => {
    try {
      let result;
      
      // Check if the prompt is asking about model identity
      const isModelQuery = prompt.toLowerCase().includes('which model') || 
                          prompt.toLowerCase().includes('what model') ||
                          prompt.toLowerCase().includes('who are you');

      // Function to prepend model identity if needed
      const prependModelIdentity = (response: string, modelName: string) => {
        if (isModelQuery) {
          return `Hi, I'm ${modelName}! ${response}`;
        }
        return response;
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

        const generatedText = response.choices[0]?.message?.content;

        if (!generatedText) {
          throw new Error('No content generated from Together AI');
        }

        const formattedText = formatAIResponse(
          prependModelIdentity(generatedText, modelName)
        );
        setGeneratedContent(formattedText);
        return formattedText;
      }

      // Check if it's an OpenRouter model
      if (selectedModel.includes('/') && !selectedModel.startsWith('together/')) {
        const response = await openRouterClient.chat.completions.create({
          model: selectedModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096,
          temperature: 0.7,
          top_p: 0.4
        });

        const generatedText = response.choices[0]?.message?.content;

        if (!generatedText) {
          throw new Error('No content generated from OpenRouter');
        }

        if (generatedText) {
          const formattedText = formatAIResponse(
            prependModelIdentity(generatedText, selectedModel)
          );
          setGeneratedContent(formattedText);
          return formattedText;
        }
      }

      // Handle Google models separately
      if (selectedModel.startsWith('gemini')) {
        let modelName;
        switch (selectedModel) {
          case 'gemini-1.5-flash':
            modelName = 'gemini-1.5-flash-001';
            break;
          case 'gemini-1.5-pro':
            modelName = 'gemini-1.5-pro-002';
            break;
          default:
            modelName = 'gemini-1.5-pro-002';
        }

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedText = response.text();
        
        if (generatedText) {
          const formattedText = formatAIResponse(
            prependModelIdentity(generatedText, modelName)
          );
          setGeneratedContent(formattedText);
          return formattedText;
        }

        throw new Error('No content generated');
      }

      // Handle other models
      let selectedModelInstance;
      let modelIdentifier = selectedModel; // Default identifier

      switch (selectedModel) {
        case 'open-mistral-nemo':
          modelIdentifier = 'Open Mistral Nemo';
          selectedModelInstance = createMistral({
            apiKey: import.meta.env.VITE_MISTRAL_API_KEY || ''
          })('open-mistral-nemo');
          break;
        case 'mistral-large':
          modelIdentifier = 'Mistral Large';
          selectedModelInstance = createMistral({
            apiKey: import.meta.env.VITE_MISTRAL_API_KEY || ''
          })('mistral-large-2407');
          break;
        case 'pixtral-12b-2409':
          modelIdentifier = 'Pixtral 12B';
          selectedModelInstance = createMistral({
            apiKey: import.meta.env.VITE_MISTRAL_API_KEY || ''
          })('pixtral-12b-2409');
          break;
        case 'codestral-mamba-2407':
          modelIdentifier = 'Codestral Mamba';
          selectedModelInstance = createMistral({
            apiKey: import.meta.env.VITE_MISTRAL_API_KEY || ''
          })('codestral-mamba-2407');
          break;
        case 'xai':
          modelIdentifier = 'Grok Beta';
          selectedModelInstance = xai('grok-beta');
          break;
        case 'groq':
          modelIdentifier = 'Llama 3.2 90B Vision';
          selectedModelInstance = createGroq({
            apiKey: import.meta.env.VITE_GROQ_API_KEY || ''
          })('llama-3.2-90b-vision-preview');
          break;
        default:
          throw new Error('Invalid model selected');
      }

      result = await generateText({
        model: selectedModelInstance,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 4096,
        temperature: 0.7,
        topP: 0.4,
      });

      if (!result.text) {
        throw new Error('No content generated');
      }

      if (result.text) {
        const formattedText = formatAIResponse(
          prependModelIdentity(result.text, modelIdentifier)
        );
        setGeneratedContent(formattedText);
        return formattedText;
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