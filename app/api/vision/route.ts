import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY || '');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Supported MIME types for document processing
const SUPPORTED_DOC_TYPES = [
  'application/pdf',
  'application/x-javascript',
  'text/javascript',
  'application/x-python',
  'text/x-python',
  'text/plain',
  'text/html',
  'text/css',
  'text/md',
  'text/csv',
  'text/xml',
  'text/rtf'
];

// Supported MIME types for vision processing
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;
  
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const prompt = formData.get('prompt') as string;
    const model = formData.get('model') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!SUPPORTED_DOC_TYPES.includes(file.type) && !SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Create a temporary file path
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    tempFilePath = join(tmpdir(), `upload-${Date.now()}-${file.name}`);
    await writeFile(tempFilePath, buffer);

    // Upload file to Google AI
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: file.type,
      displayName: file.name,
    });

    // Initialize Gemini model with appropriate configuration
    const geminiModel = genAI.getGenerativeModel({ 
      model: model || "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      }
    });

    const isDocument = SUPPORTED_DOC_TYPES.includes(file.type);
    let defaultPrompt = isDocument 
      ? `Please analyze this ${file.type} document and provide a detailed summary.` 
      : "Describe this image in detail.";

    if (prompt) {
      defaultPrompt = `${defaultPrompt}\n\nSpecific request: ${prompt}`;
    }

    const result = await geminiModel.generateContent([
      defaultPrompt,
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Clean up the uploaded file from Google AI
    await fileManager.deleteFile(uploadResult.file.name);

    return NextResponse.json({
      result: text,
      fileType: isDocument ? 'document' : 'image'
    });

  } catch (error) {
    console.error('File processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    );
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (error) {
        console.error('Error cleaning up temp file:', error);
      }
    }
  }
} 