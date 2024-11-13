import { NextResponse } from 'next/server';
import {
  DynamicRetrievalMode,
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

// Initialize the Google AI client with proper error handling
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    // Initialize the model with dynamic retrieval configuration
    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-pro-002",  // Changed to gemini-pro as it's more stable
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Create a chat
    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 2048,
      },
    });

    // Generate content with the prompt
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    
    if (!response) {
      throw new Error('No response generated');
    }

    return NextResponse.json({ 
      result: response.text(),
      groundingMetadata: null // We'll add this feature once the basic chat is working
    });

  } catch (error) {
    console.error('Lively generation error:', error);
    
    // Improved error handling with specific error messages
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to generate content';
      
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 