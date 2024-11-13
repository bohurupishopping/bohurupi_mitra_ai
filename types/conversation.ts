export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface DatabaseMessage {
  prompt: string;
  response: string;
  timestamp?: string;
  session_id: string;
} 