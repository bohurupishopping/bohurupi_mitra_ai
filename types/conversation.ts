export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  attachments?: string[];
  fileType?: 'image' | 'document';
}

export interface DatabaseMessage {
  prompt: string;
  response: string;
  timestamp?: string;
  session_id: string;
  file_type?: 'image' | 'document';
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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  attachments?: string[];
  fileType?: 'image' | 'document';
} 