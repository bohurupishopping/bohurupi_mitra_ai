import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface ImageSession {
  session_id: string;
  image_url: string;
  last_prompt: string;
  timestamp: string;
}

export class ImageHistoryService {
  async saveImage(prompt: string, imageUrl: string, negativePrompt?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('image_history')
        .insert({
          session_id: uuidv4(),
          prompt,
          image_url: imageUrl,
          negative_prompt: negativePrompt,
          timestamp: new Date().toISOString()
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
      const { data, error } = await supabase
        .from('image_history')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        session_id: item.session_id,
        image_url: item.image_url,
        last_prompt: item.prompt,
        timestamp: item.timestamp
      }));
    } catch (error) {
      console.error('Error fetching image history:', error);
      throw error;
    }
  }

  async deleteImage(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('image_history')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;
      
      window.dispatchEvent(new CustomEvent('image-history-updated'));
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
} 