import { NextResponse } from 'next/server';
import OpenAI from 'openai';

type ImageSize = '1024x1024' | '1024x1792' | '1792x1024';

// Initialize the OpenAI client with Together's configuration
const client = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: "https://api.together.xyz/v1",
});

// Helper function for better prompt formatting
const formatEnhancedPrompt = (
  mainPrompt: string, 
  size: ImageSize
): { prompt: string; negative_prompt: string } => {
  // Enhance positive prompt
  const enhancedPrompt = `
    Create a highly detailed image:
    ${mainPrompt}
    Style: This breathtaking photograph, (realistic, photo-Realistic:1.3), best quality, masterpiece, beautiful and aesthetic, cinematic lighting, ambient lighting, backlit, softer lens filter, full of love and romantic atmosphere, beautifully showcases the raw and authentic beauty of life, 
    Technical details: ${size}, 16K, (HDR:1.4), high contrast, (vibrant color:1.4), (muted colors, dim colors, soothing tones:0), shot on Kodak Gold 400 film, high resolution 8k image quality, more detail
  `.trim();

  // Enhance negative prompt
  const enhancedNegativePrompt = `
    low quality, blurry, pixelated, poor composition, 
    bad lighting, distorted proportions, deformed, 
    watermark, signature, text, duplicate, error
  `.trim();

  return {
    prompt: enhancedPrompt,
    negative_prompt: enhancedNegativePrompt
  };
};

export async function POST(request: Request) {
  try {
    const { prompt, model, size = '1024x1024' } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const { prompt: enhancedPrompt, negative_prompt } = formatEnhancedPrompt(prompt, size as ImageSize);

    // Use the OpenAI client to generate image
    const response = await client.images.generate({
      model: model,
      prompt: enhancedPrompt,
      n: 1,
      size: size,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No image generated');
    }

    return NextResponse.json({
      success: true,
      data: [{
        url: response.data[0].url
      }]
    });

  } catch (error: any) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to generate image'
      },
      { status: 500 }
    );
  }
} 