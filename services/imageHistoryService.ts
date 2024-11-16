import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';
import { uploadImageToStorage, deleteImageFromStorage } from '@/utils/supabaseStorage';

export interface ImageSession {
  id: string;
  session_id: string;
  prompt: string;
  image_url: string;
  storage_path?: string;
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

  async saveImage(prompt: string, togetherImageUrl: string, negativePrompt?: string): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      const sessionId = uuidv4();

      // First, upload the image to Supabase Storage and get permanent URL
      const permanentUrl = await uploadImageToStorage(togetherImageUrl, sessionId);
      if (!permanentUrl) {
        throw new Error('Failed to get public URL after upload');
      }

      const storagePath = `generated/${sessionId}-${Date.now()}.png`;

      // Save to database with the permanent Supabase URL
      const { error } = await this.supabase
        .from('image_history')
        .insert({
          session_id: sessionId,
          prompt,
          image_url: permanentUrl, // Use the permanent Supabase URL
          storage_path: storagePath,
          negative_prompt: negativePrompt || null,
          user_id: user?.id || null,
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
      const { data: { user } } = await this.supabase.auth.getUser();
      
      const { data, error } = await this.supabase
        .from('image_history')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Ensure we're using the permanent URLs from storage
      const images = (data || []).map(image => ({
        ...image,
        image_url: image.image_url // This is now the permanent Supabase URL
      })) as ImageSession[];

      return images;
    } catch (error) {
      console.error('Error fetching image history:', error);
      throw error;
    }
  }

  async deleteImage(id: string): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Get the storage path first
      const { data: imageData, error: fetchError } = await this.supabase
        .from('image_history')
        .select('storage_path')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage if path exists
      if (imageData?.storage_path) {
        await deleteImageFromStorage(imageData.storage_path);
      }

      // Delete from database only after successful storage deletion
      const { error: dbError } = await this.supabase
        .from('image_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (dbError) throw dbError;
      
      window.dispatchEvent(new CustomEvent('image-history-updated'));
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
} 