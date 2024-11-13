import { generateText } from 'ai';
import OpenAI from 'openai';

// Initialize OpenRouter client
const openRouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: import.meta.env.VITE_OPEN_ROUTER_API_KEY || 'dummy-key',
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    "HTTP-Referer": window.location.origin,
    "X-Title": "Creative Scribe",
  }
});

export interface ChatOptions {
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export async function generateChatResponse(
  prompt: string, 
  options: ChatOptions,
  modelInstance: any
) {
  try {
    // Handle OpenRouter models
    if (options.model.includes('/')) {
      const response = await openRouterClient.chat.completions.create({
        model: options.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.4
      });

      return response.choices[0]?.message?.content || null;
    }

    // Handle other models
    const result = await generateText({
      model: modelInstance,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      topP: options.topP || 0.4,
    });

    return result.text || null;
  } catch (error) {
    console.error('Chat generation error:', error);
    throw error;
  }
} 