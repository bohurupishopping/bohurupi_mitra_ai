import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { v4 as uuidv4 } from 'uuid';

// Add this new function to get current user
async function getCurrentUser() {
  const supabase = createClientComponentClient();
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function uploadAttachment(file: File) {
  const supabase = createClientComponentClient();
  
  try {
    // Get current user inside the upload function
    const user = await getCurrentUser();
    
    // Generate a unique filename with original extension
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id || 'anonymous'}/${uuidv4()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Upload file to Supabase
    const { data, error } = await supabase
      .storage
      .from('chat-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
} 