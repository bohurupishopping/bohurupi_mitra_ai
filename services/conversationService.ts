"use client";

import { v4 as uuidv4 } from 'uuid';
import type { DatabaseMessage } from '@/types/conversation';
import { getSupabaseClient } from '@/lib/supabaseClient';

export interface ChatSession {
  session_id: string;
  last_message: string;
  timestamp: string;
  message_count: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export class ConversationService {
  private sessionId: string;
  private supabase;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || uuidv4();
    this.supabase = getSupabaseClient();
  }

  private async getCurrentUser() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) throw error;
      return session?.user || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async saveConversation(prompt: string, response: string) {
    try {
      const user = await this.getCurrentUser();
      const messageId = uuidv4();

      const { error } = await this.supabase
        .from('conversations')
        .insert([
          {
            session_id: this.sessionId,
            message_id: messageId,
            user_id: user?.id || null,
            prompt,
            response,
            timestamp: new Date().toISOString(),
          },
        ]);

      if (error) throw error;
      
      window.dispatchEvent(new CustomEvent('chat-updated'));
      
      return messageId;
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  async loadChatSession(sessionId: string): Promise<ChatMessage[]> {
    try {
      const user = await this.getCurrentUser();
      
      let query = this.supabase
        .from('conversations')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_deleted', false)
        .order('timestamp', { ascending: true });

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map((msg: DatabaseMessage): ChatMessage[] => ([
        { role: 'user' as const, content: msg.prompt },
        { role: 'assistant' as const, content: msg.response }
      ])).flat();
    } catch (error) {
      console.error('Error loading chat session:', error);
      throw error;
    }
  }

  async getChatSessions(limit: number = 7): Promise<ChatSession[]> {
    try {
      const user = await this.getCurrentUser();
      
      let query = this.supabase
        .from('conversations')
        .select('*')
        .eq('is_deleted', false)
        .order('timestamp', { ascending: false });

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.is('user_id', null);
      }

      const { data: sessions, error } = await query;

      if (error) throw error;

      const sessionMap = new Map<string, {
        session_id: string;
        last_message: string;
        timestamp: string;
        message_count: number;
      }>();

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
          session.message_count += 1;
        }
      });

      const formattedSessions = Array.from(sessionMap.values())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      return formattedSessions;
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      return [];
    }
  }

  async clearConversationHistory() {
    try {
      const user = await this.getCurrentUser();
      
      let query = this.supabase
        .from('conversations')
        .update({ is_deleted: true });

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.is('user_id', null);
      }

      const { error } = await query;
      if (error) throw error;
      
      window.dispatchEvent(new CustomEvent('chat-updated'));
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      throw error;
    }
  }

  async deleteChatSession(sessionId: string) {
    try {
      const user = await this.getCurrentUser();
      
      let query = this.supabase
        .from('conversations')
        .update({ is_deleted: true })
        .eq('session_id', sessionId);

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.is('user_id', null);
      }

      const { error } = await query;
      if (error) throw error;
      
      window.dispatchEvent(new CustomEvent('chat-updated'));
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async getRecentConversations(limit: number = 5): Promise<ChatMessage[]> {
    try {
      const user = await this.getCurrentUser();
      
      let query = this.supabase
        .from('conversations')
        .select('*')
        .eq('is_deleted', false)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map((msg: DatabaseMessage): ChatMessage[] => ([
        { role: 'user' as const, content: msg.prompt },
        { role: 'assistant' as const, content: msg.response }
      ])).flat();
    } catch (error) {
      console.error('Error getting recent conversations:', error);
      return [];
    }
  }
}