import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createOpenAI } from '@ai-sdk/openai/dist';
import { createMistral } from '@ai-sdk/mistral/dist';
import { createGroq } from '@ai-sdk/groq/dist';
import { generateText } from 'ai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from 'groq-sdk';

// Initialize clients with server-side env variables
const openRouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_ROUTER_API_KEY || '',
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL,
    "X-Title": "Creative Scribe",
  }
});

const mistralClient = createMistral({
  apiKey: process.env.MISTRAL_API_KEY || ''
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

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

// Initialize Google AI client
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { model, prompt, options } = await req.json();
    let result: string | null = null;

    // Handle Hermes model streaming first
    if (model === 'nousresearch/hermes-3-llama-3.1-405b:free') {
      const stream = await openRouterClient.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.7,
        top_p: options?.topP || 0.4,
        stream: true
      });

      const textEncoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          let accumulatedText = '';
          
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              accumulatedText += content;
              
              // Send the chunk with paragraph information
              const data = {
                text: content,
                accumulated: accumulatedText,
                done: false
              };
              
              controller.enqueue(textEncoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            }
            
            // Send final accumulated text
            controller.enqueue(
              textEncoder.encode(
                `data: ${JSON.stringify({ text: '', accumulated: accumulatedText, done: true })}\n\n`
              )
            );
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle Gemini models
    else if (model.startsWith('gemini-')) {
      const modelName = model;
      const googleModel = googleAI.getGenerativeModel({ model: modelName });
      
      if (model === 'gemini-1.5-pro') {
        const response = await googleModel.generateContentStream(prompt);
        let fullText = '';
        
        for await (const chunk of response.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
        }
        
        result = fullText;
      } else {
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

      result = response.choices[0]?.message?.content || null;
    } 
    // Handle OpenRouter models
    else if (model.includes('/')) {
      const response = await openRouterClient.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.7,
        top_p: options?.topP || 0.4,
        stream: false
      });

      result = response.choices[0]?.message?.content || null;
    }
    // Handle other models
    else {
      if (model === 'groq') {
        const hasImageUrl = prompt.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i);
        
        const response = await groqClient.chat.completions.create({
          model: "llama-3.2-90b-vision-preview",
          messages: hasImageUrl 
            ? [{ 
                role: "user", 
                content: [{ type: "text", text: prompt }] 
              }]
            : [{ role: "user", content: prompt }],
          max_tokens: options?.maxTokens || 4096,
          temperature: options?.temperature || 0.7,
          top_p: options?.topP || 0.4,
          stream: false
        });

        result = response.choices[0]?.message?.content || null;
      } else {
        let modelInstance;
        
        switch (model) {
          case 'open-mistral-nemo':
            modelInstance = mistralClient('open-mistral-nemo');
            break;
          case 'mistral-large':
            modelInstance = mistralClient('mistral-large-2407');
            break;
          case 'xai':
            modelInstance = xai('grok-beta');
            break;
          default:
            throw new Error('Invalid model selected');
        }

        const response = await generateText({
          model: modelInstance,
          messages: [{ role: 'user', content: prompt }],
          maxTokens: options?.maxTokens || 4096,
          temperature: options?.temperature || 0.7,
          topP: options?.topP || 0.4,
        });

        result = response.text;
      }
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