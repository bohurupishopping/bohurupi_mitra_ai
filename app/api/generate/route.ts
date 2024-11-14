import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createOpenAI } from '@ai-sdk/openai/dist';
import { createMistral } from '@ai-sdk/mistral/dist';
import { createGroq } from '@ai-sdk/groq/dist';
import { generateText } from 'ai';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize clients with server-side env variables
const openRouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL,
    "X-Title": "Creative Scribe",
  }
});

const xai = createOpenAI({
  name: 'xai',
  baseURL: 'https://api.x.ai/v1',
  apiKey: process.env.XAI_API_KEY ?? '',
});

const togetherClient = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY || '',
  baseURL: 'https://api.together.xyz/v1',
});

const mistralClient = createMistral({
  apiKey: process.env.MISTRAL_API_KEY || ''
});

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY || ''
});

// Initialize Google AI client
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { model, prompt, options } = await req.json();

    let result;

    // Handle Google AI models with streaming for Gemini 1.5 Pro
    if (model.startsWith('gemini-')) {
      const modelName = model;
      const googleModel = googleAI.getGenerativeModel({ model: modelName });
      
      if (model === 'gemini-1.5-pro') {
        // Use streaming for Gemini 1.5 Pro
        const response = await googleModel.generateContentStream(prompt);
        let fullText = '';
        
        for await (const chunk of response.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
        }
        
        result = fullText;
      } else {
        // Use regular generation for other Gemini models
        const response = await googleModel.generateContent(prompt);
        result = response.response.text();
      }
    }
    // Handle Together AI models
    else if (model.startsWith('together/')) {
      const modelName = model.replace('together/', '');
      const response = await togetherClient.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.7,
        top_p: options?.topP || 0.4
      });

      result = response.choices[0]?.message?.content;
    } 
    // Handle OpenRouter models
    else if (model.includes('/')) {
      const response = await openRouterClient.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.7,
        top_p: options?.topP || 0.4
      });

      result = response.choices[0]?.message?.content;
    }
    // Handle other models
    else {
      let modelInstance;
      switch (model) {
        case 'open-mistral-nemo':
          modelInstance = mistralClient('open-mistral-nemo');
          break;
        case 'mistral-large':
          modelInstance = mistralClient('mistral-large-2407');
          break;
        case 'groq':
          modelInstance = groqClient('llama-3.2-90b-text-preview');
          break;
        case 'xai':
          modelInstance = xai('grok-beta');
          break;
        default:
          throw new Error('Invalid model selected');
      }

      // Use generateText for AI SDK models
      const response = await generateText({
        model: modelInstance,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.7,
        topP: options?.topP || 0.4,
      });

      result = response.text;
    }

    if (!result) {
      throw new Error('No content generated');
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate content' },
      { status: 500 }
    );
  }
} 