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
- IMPORTANT: Respond ONLY with the enhanced prompt text
- Do NOT include any explanatory text, prefixes, or suffixes
- Do NOT include phrases like "Enhanced prompt:" or "This prompt provides..."
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
          content: prompt // Send just the prompt without additional text
        }
      ],
      temperature: 0.7,
    });

    // Clean up the response by removing any common prefixes or suffixes
    let enhancedPrompt = completion.choices[0].message.content?.trim() || '';
    
    // Remove common prefixes that might appear
    enhancedPrompt = enhancedPrompt
      .replace(/^(Enhanced prompt:|Enhance the prompt:|This prompt:|Here's the enhanced prompt:)/i, '')
      .replace(/^["']|["']$/g, '') // Remove quotes at start/end if present
      .trim();
    
    // Remove common suffixes that might appear
    enhancedPrompt = enhancedPrompt
      .replace(/\b(This enhanced prompt provides|This description provides).*$/i, '')
      .trim();

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