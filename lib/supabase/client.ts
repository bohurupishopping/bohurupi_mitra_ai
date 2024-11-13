import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase/database.types';

// Create a single instance of the Supabase client for client components
export const createClient = () => {
  return createClientComponentClient<Database>({
    options: {
      db: {
        schema: 'public',
      },
    },
  });
};

// Export a singleton instance
export const supabase = createClient(); 