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
  timestamp?: string;
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
          content: item.prompt
        },
        {
          role: 'assistant',
          content: item.response
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
        .from('conversations')
        .select('*')
        .eq('is_deleted', false)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Group by session_id and get latest message
      const sessionMap = new Map<string, ChatSession>();
      
      data?.forEach(msg => {
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
      // Delete all messages for this session from conversations table
      const { error } = await supabase
        .from('conversations')
        .delete()  // Using delete instead of update since we want to remove the records
        .eq('session_id', sessionId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      // If we're deleting the current session, generate a new session ID
      if (sessionId === this.sessionId) {
        this.sessionId = uuidv4();
      }

      // Dispatch event to update UI
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
          content: item.prompt
        },
        {
          role: 'assistant',
          content: item.response
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