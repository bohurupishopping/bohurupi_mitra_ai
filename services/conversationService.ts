"use client";

import { v4 as uuidv4 } from 'uuid';
import type { DatabaseMessage } from '@/types/conversation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { SupabaseClient } from '@supabase/supabase-js';

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

export class ConversationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ConversationError';
  }
}

export class ConversationService {
  private readonly sessionId: string;
  private readonly supabase: SupabaseClient;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || uuidv4();
    this.supabase = getSupabaseClient();
  }

  private async getCurrentUser() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) {
        throw new ConversationError('Failed to get current user session', error);
      }
      return session?.user || null;
    } catch (error) {
      throw new ConversationError('Error getting current user', error);
    }
  }

  async saveConversation(prompt: string, response: string): Promise<string> {
    if (!prompt || !response) {
      throw new ConversationError('Prompt and response are required');
    }

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
            is_deleted: false,
          },
        ]);

      if (error) {
        throw new ConversationError('Failed to save conversation', error);
      }
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chat-updated'));
      }
      
      return messageId;
    } catch (error) {
      throw new ConversationError('Error saving conversation', error);
    }
  }

  async loadChatSession(sessionId: string): Promise<ChatMessage[]> {
    if (!sessionId) {
      throw new ConversationError('Session ID is required');
    }

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

      if (error) {
        throw new ConversationError('Failed to load chat session', error);
      }

      if (!data) {
        return [];
      }

      return data.map((msg: DatabaseMessage): ChatMessage[] => ([
        { 
          role: 'user',
          content: msg.prompt,
          timestamp: msg.timestamp 
        },
        { 
          role: 'assistant',
          content: msg.response,
          timestamp: msg.timestamp 
        }
      ])).flat();
    } catch (error) {
      throw new ConversationError('Error loading chat session', error);
    }
  }

  async getChatSessions(limit: number = 7): Promise<ChatSession[]> {
    if (limit < 1) {
      throw new ConversationError('Limit must be greater than 0');
    }

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

      if (error) {
        throw new ConversationError('Failed to get chat sessions', error);
      }

      if (!sessions) {
        return [];
      }

      const sessionMap = new Map<string, ChatSession>();

      sessions.forEach(msg => {
        if (!sessionMap.has(msg.session_id)) {
          sessionMap.set(msg.session_id, {
            session_id: msg.session_id,
            last_message: msg.prompt,
            timestamp: msg.timestamp,
            message_count: 1
          });
        } else {
          const session = sessionMap.get(msg.session_id);
          if (session) {
            session.message_count += 1;
          }
        }
      });

      return Array.from(sessionMap.values())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      throw new ConversationError('Error getting chat sessions', error);
    }
  }

  async clearConversationHistory(): Promise<void> {
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
      if (error) {
        throw new ConversationError('Failed to clear conversation history', error);
      }
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chat-updated'));
      }
    } catch (error) {
      throw new ConversationError('Error clearing conversation history', error);
    }
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    if (!sessionId) {
      throw new ConversationError('Session ID is required');
    }

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
      if (error) {
        throw new ConversationError('Failed to delete chat session', error);
      }
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chat-updated'));
      }
    } catch (error) {
      throw new ConversationError('Error deleting chat session', error);
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async getRecentConversations(limit: number = 5): Promise<ChatMessage[]> {
    if (limit < 1) {
      throw new ConversationError('Limit must be greater than 0');
    }

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

      if (error) {
        throw new ConversationError('Failed to get recent conversations', error);
      }

      if (!data) {
        return [];
      }

      return data.map((msg: DatabaseMessage): ChatMessage[] => ([
        { 
          role: 'user',
          content: msg.prompt,
          timestamp: msg.timestamp 
        },
        { 
          role: 'assistant',
          content: msg.response,
          timestamp: msg.timestamp 
        }
      ])).flat();
    } catch (error) {
      throw new ConversationError('Error getting recent conversations', error);
    }
  }
}