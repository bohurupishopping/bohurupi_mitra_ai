export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string;
          message_id: string;
          prompt: string;
          response: string;
          timestamp: string;
          metadata: Json;
          is_deleted: boolean;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id: string;
          message_id?: string;
          prompt: string;
          response: string;
          timestamp?: string;
          metadata?: Json;
          is_deleted?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string;
          message_id?: string;
          prompt?: string;
          response?: string;
          timestamp?: string;
          metadata?: Json;
          is_deleted?: boolean;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      image_history: {
        Row: {
          id: string;
          session_id: string;
          prompt: string;
          image_url: string;
          storage_path: string | null;
          negative_prompt: string | null;
          user_id: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          prompt: string;
          image_url: string;
          storage_path?: string | null;
          negative_prompt?: string | null;
          user_id?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          prompt?: string;
          image_url?: string;
          storage_path?: string | null;
          negative_prompt?: string | null;
          user_id?: string | null;
          timestamp?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 