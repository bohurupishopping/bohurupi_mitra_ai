"use client";

import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface ChatSession {
  session_id: string;
  last_message: string;
  timestamp: string;
  message_count: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export class ConversationService {
  private sessionId: string;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || uuidv4();
  }

  async saveConversation(prompt: string, response: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .insert({
          session_id: this.sessionId,
          message_id: uuidv4(),
          prompt,
          response,
          timestamp: new Date().toISOString(),
          metadata: {},
          is_deleted: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  async loadChatSession(sessionId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_deleted', false)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (!data) return [];

      return data.flatMap(item => ([
        {
          role: 'user',
          content: item.prompt,
          timestamp: new Date(item.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        },
        {
          role: 'assistant',
          content: item.response,
          timestamp: new Date(item.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }
      ]));
    } catch (error) {
      console.error('Error loading chat session:', error);
      throw error;
    }
  }

  async getChatSessions(limit: number = 10): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_stats')
        .select('*')
        .limit(limit);

      if (error) throw error;

      return data?.map(session => ({
        session_id: session.session_id,
        last_message: session.session_end,
        timestamp: session.session_end,
        message_count: session.message_count
      })) || [];
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      throw error;
    }
  }

  async clearConversationHistory(): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_deleted: true })
        .eq('session_id', this.sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      throw error;
    }
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_deleted: true })
        .eq('session_id', sessionId);

      if (error) throw error;

      if (sessionId === this.sessionId) {
        this.sessionId = uuidv4();
      }

      window.dispatchEvent(new CustomEvent('chat-updated'));
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  }

  async getRecentConversations(limit: number = 5): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('session_id', this.sessionId)
        .eq('is_deleted', false)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (!data) return [];

      return data.flatMap(item => ([
        {
          role: 'user',
          content: item.prompt,
          timestamp: new Date(item.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        },
        {
          role: 'assistant',
          content: item.response,
          timestamp: new Date(item.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }
      ]));
    } catch (error) {
      console.error('Error getting recent conversations:', error);
      throw error;
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }
}