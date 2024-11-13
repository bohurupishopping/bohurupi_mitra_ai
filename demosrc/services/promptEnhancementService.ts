import { createMistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

const mistralClient = createMistral({
  apiKey: import.meta.env.VITE_MISTRAL_API_KEY || ''
})('ministral-3b-latest');

export const enhancePrompt = async (prompt: string): Promise<string> => {
  try {
    const enhancementPrompt = `
      You are an expert at writing prompts for AI image generation.
      Please enhance the following prompt to create a more detailed and visually descriptive version.
      Focus on adding specific details about style, lighting, composition, and mood.
      Keep the enhanced prompt concise but descriptive.
      
      Original prompt: "${prompt}"
      
      Enhanced prompt:`;

    const response = await generateText({
      model: mistralClient,
      messages: [{ role: 'user', content: enhancementPrompt }],
      maxTokens: 200,
    });

    return response.text.trim();
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    throw new Error('Failed to enhance prompt');
  }
}; 