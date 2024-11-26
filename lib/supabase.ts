import { getSupabaseClient } from './supabaseClient';

const supabase = getSupabaseClient();

export { supabase };

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Delete any client-side data here
    localStorage.clear();
  }
});