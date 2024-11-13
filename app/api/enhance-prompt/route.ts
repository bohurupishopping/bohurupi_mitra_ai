import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: 'https://api.mistral.ai/v1',
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model: 'ministral-3b-latest',
      messages: [
        {
          role: 'system',
          content: `You are an expert at writing prompts for AI image generation.
      Please enhance the following prompt to create a more detailed and visually descriptive version.
      Focus on adding specific details about style, lighting, composition, and mood.
      Keep the enhanced prompt concise but descriptive.`
        },
        {
          role: 'user',
          content: `Original prompt: "${prompt}"
            
            Enhanced prompt:`
        }
      ],
      temperature: 0.7,
    });

    const enhancedPrompt = completion.choices[0].message.content?.trim();

    return NextResponse.json({
      success: true,
      enhancedPrompt: enhancedPrompt
    });
  } catch (error: any) {
    console.error('Error enhancing prompt:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to enhance prompt' },
      { status: 500 }
    );
  }
} 