import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

interface GeminiModel {
  id: string;
  name: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  provider: string;
  temperature: number;
  topP: number;
  releaseDate?: string;
}

export async function GET() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

    // Comprehensive list of available Gemini models
    const models: GeminiModel[] = [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash',
        description: 'Next generation features, superior speed, native tool use, and multimodal generation',
        inputTokenLimit: 1000000,
        outputTokenLimit: 1000000,
        provider: 'Google',
        temperature: 0.7,
        topP: 0.4,
        releaseDate: '2024-12-11'
      },
      {
        id: 'gemini-exp-1206',
        name: 'Gemini 1206',
        description: 'Quality improvements, celebrate 1 year of Gemini',
        inputTokenLimit: 128000,
        outputTokenLimit: 128000,
        provider: 'Google',
        temperature: 0.7,
        topP: 0.4,
        releaseDate: '2024-12-06'
      },

    ];

    return NextResponse.json({
      models,
      status: "success"
    });

  } catch (error) {
    console.error('Error with Gemini models:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get models' },
      { status: 500 }
    );
  }
} 