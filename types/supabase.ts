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
      image_history: {
        Row: {
          id: string
          session_id: string
          prompt: string
          negative_prompt: string | null
          image_url: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          id?: string
          session_id: string
          prompt: string
          negative_prompt?: string | null
          image_url: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          prompt?: string
          negative_prompt?: string | null
          image_url?: string
          timestamp?: string
          user_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 