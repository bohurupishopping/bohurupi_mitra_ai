import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export async function uploadImageToStorage(imageUrl: string, sessionId: string): Promise<string> {
  const supabase = createClientComponentClient<Database>();
  
  try {
    // First fetch the image through our API
    const response = await fetch('/api/save-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch image from API');
    }

    const imageBlob = await response.blob();

    // Generate a unique filename
    const filename = `${sessionId}-${Date.now()}.png`;
    const storagePath = `generated/${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('ai-generated-images')
      .upload(storagePath, imageBlob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('ai-generated-images')
      .getPublicUrl(storagePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    throw error;
  }
}

export async function deleteImageFromStorage(storagePath: string): Promise<void> {
  const supabase = createClientComponentClient<Database>();
  
  try {
    // Extract the filename from the storage path
    const filename = storagePath.split('/').pop();
    if (!filename) {
      throw new Error('Invalid storage path');
    }

    // Delete the file from storage
    const { error } = await supabase
      .storage
      .from('ai-generated-images')
      .remove([storagePath]);

    if (error) {
      console.error('Error deleting from storage:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteImageFromStorage:', error);
    throw error;
  }
} 