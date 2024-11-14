import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface ImageSession {
  id: string;
  session_id: string;
  prompt: string;
  image_url: string;
  negative_prompt?: string | null;
  user_id?: string | null;
  timestamp: string;
}

export class ImageHistoryService {
  private static instance: ImageHistoryService;
  private supabase;

  private constructor() {
    this.supabase = createClientComponentClient<Database>();
  }

  public static getInstance(): ImageHistoryService {
    if (!ImageHistoryService.instance) {
      ImageHistoryService.instance = new ImageHistoryService();
    }
    return ImageHistoryService.instance;
  }

  async saveImage(prompt: string, imageUrl: string, negativePrompt?: string): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      const { error } = await this.supabase
        .from('image_history')
        .insert({
          session_id: uuidv4(),
          prompt,
          image_url: imageUrl,
          negative_prompt: negativePrompt || null,
          user_id: user?.id || null
        });

      if (error) throw error;
      
      window.dispatchEvent(new CustomEvent('image-history-updated'));
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  }

  async getImageHistory(): Promise<ImageSession[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      const { data, error } = await this.supabase
        .from('image_history')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return (data || []) as ImageSession[];
    } catch (error) {
      console.error('Error fetching image history:', error);
      throw error;
    }
  }

  async deleteImage(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('image_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      window.dispatchEvent(new CustomEvent('image-history-updated'));
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
} 