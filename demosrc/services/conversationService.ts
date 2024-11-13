import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationMessage {
  prompt: string;
  response: string;
  timestamp: string;
}

export interface ChatSession {
  session_id: string;
  last_message: string;
  timestamp: string;
  message_count: number;
}

export class ConversationService {
  private sessionId: string;

  constructor(existingSessionId?: string) {
    this.sessionId = existingSessionId || this.generateNewSessionId();
  }

  private generateNewSessionId(): string {
    try {
      return uuidv4();
    } catch (error) {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  async saveConversation(prompt: string, response: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .insert({
          session_id: this.sessionId,
          prompt,
          response,
          message_id: uuidv4(), // Generate unique message ID
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  async getRecentConversations(limit: number = 10): Promise<ConversationMessage[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('prompt, response, timestamp')
        .eq('session_id', this.sessionId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Recent conversations data:', data);

      return data?.map(msg => ({
        prompt: msg.prompt,
        response: msg.response,
        timestamp: msg.timestamp
      })) || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  async clearConversationHistory(): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('session_id', this.sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      throw error;
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async getChatSessions(limit: number = 3): Promise<ChatSession[]> {
    try {
      // First, get distinct session IDs with their latest messages
      const { data: sessions, error } = await supabase
        .from('conversations')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Group by session_id and get the latest message for each session
      const sessionMap = new Map<string, ChatSession>();
      
      sessions?.forEach(msg => {
        if (!sessionMap.has(msg.session_id)) {
          sessionMap.set(msg.session_id, {
            session_id: msg.session_id,
            last_message: msg.prompt,
            timestamp: msg.timestamp,
            message_count: 1
          });
        } else {
          const session = sessionMap.get(msg.session_id)!;
          session.message_count++;
        }
      });

      return Array.from(sessionMap.values()).slice(0, limit);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      throw error;
    }
  }

  async loadChatSession(sessionId: string): Promise<Message[]> {
    try {
      // Set the current session ID first
      this.setSessionId(sessionId);

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log('No messages found for session:', sessionId);
        return [];
      }

      // Map the data to Message format
      const messages: Message[] = data.flatMap(msg => ([
        {
          role: 'user',
          content: msg.prompt,
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        },
        {
          role: 'assistant',
          content: msg.response,
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }
      ]));

      console.log('Loaded messages:', messages);
      return messages;
    } catch (error) {
      console.error('Error loading chat session:', error);
      throw error;
    }
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      // Delete all messages with this session_id from the database
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      // If we're deleting the current session, generate a new session ID
      if (sessionId === this.sessionId) {
        this.sessionId = this.generateNewSessionId();
      }

      // Dispatch event to update UI
      window.dispatchEvent(new CustomEvent('chat-updated'));
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  }
} 