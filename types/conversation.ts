export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  attachments?: string[];
}

export interface DatabaseMessage {
  prompt: string;
  response: string;
  timestamp?: string;
  session_id: string;
}

export interface FileUpload {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document';
  uploading: boolean;
  url?: string;
  path?: string;
} 