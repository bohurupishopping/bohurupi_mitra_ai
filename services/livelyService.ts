"use client";

import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { ConversationService } from './conversationService';

export class LivelyService extends ConversationService {
  constructor(sessionId?: string) {
    super(sessionId);
  }

  // Override saveConversation to include grounding metadata
  async saveConversation(
    prompt: string, 
    response: string, 
    groundingMetadata?: any
  ): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('conversations')
        .insert({
          session_id: this.getSessionId(),
          message_id: uuidv4(),
          prompt,
          response,
          timestamp: new Date().toISOString(),
          metadata: { 
            type: 'lively',
            grounding: groundingMetadata 
          },
          is_deleted: false,
          user_id: user?.id || null
        });

      if (error) throw error;
      
      return response; // Return the response string to match the parent class signature
    } catch (error) {
      console.error('Error saving lively conversation:', error);
      throw error;
    }
  }
} 