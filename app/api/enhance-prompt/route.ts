import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: 'https://api.mistral.ai/v1',
});

const systemPrompt = `You are an expert at writing prompts for AI image generation.
Your task is to enhance the given prompt to create photorealistic, highly detailed images.
Follow these guidelines:
- Add specific details about lighting, atmosphere, and composition
- Include technical photography terms and camera settings
- Specify artistic style and mood
- Keep the core subject/idea from the original prompt
- Make the prompt detailed but concise (max 200 words)
- Focus on photorealistic quality
Do not include negative prompts or technical parameters - only enhance the descriptive content.`;

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
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Original prompt: "${prompt}"
            
Please enhance this prompt to create a photorealistic image. Focus on visual details, lighting, and atmosphere.`
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