import { NextResponse } from 'next/server';
import {
  DynamicRetrievalMode,
  GoogleGenerativeAI,
} from "@google/generative-ai";

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    // Initialize the model with dynamic retrieval configuration
    const model = genAI.getGenerativeModel(
      {
        model: "models/gemini-1.5-pro-002",
        tools: [
          {
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: DynamicRetrievalMode.MODE_DYNAMIC,
                dynamicThreshold: 0.7,
              },
            },
          },
        ],
      },
      { apiVersion: "v1beta" }
    );

    try {
      // Generate content with the prompt
      const result = await model.generateContent(prompt);
      
      // Wait for the response
      const response = await result.response;
      
      // Get the text content
      const text = response.text();

      // Get grounding metadata if available
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

      // Return successful response
      return NextResponse.json({ 
        result: text,
        groundingMetadata
      });

    } catch (generationError) {
      console.error('Generation error:', generationError);
      
      // Try fallback to regular Gemini Pro if dynamic retrieval fails
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
      const fallbackResult = await fallbackModel.generateContent(prompt);
      const fallbackResponse = await fallbackResult.response;
      
      return NextResponse.json({ 
        result: fallbackResponse.text(),
        groundingMetadata: null,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Lively generation error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate content',
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          raw: error
        } : undefined
      },
      { status: 500 }
    );
  }
} 