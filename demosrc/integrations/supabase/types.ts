export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    tables: {
      conversations: {
        Row: {
          id: string
          user_id: string | null
          session_id: string
          message_id: string
          prompt: string
          response: string
          timestamp: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id: string
          message_id?: string
          prompt: string
          response: string
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string
          message_id?: string
          prompt?: string
          response?: string
          timestamp?: string
        }
      }
    }
  }
}

// Helper type to get a table's row type
export type TableRow<T extends keyof Database['public']['tables']> = 
  Database['public']['tables'][T]['Row']

// Helper type to get a table's insert type
export type TableInsert<T extends keyof Database['public']['tables']> = 
  Database['public']['tables'][T]['Insert']

// Helper type to get a table's update type
export type TableUpdate<T extends keyof Database['public']['tables']> = 
  Database['public']['tables'][T]['Update']

// Specific types for the conversations table
export type ConversationRow = TableRow<'conversations'>
export type ConversationInsert = TableInsert<'conversations'>
export type ConversationUpdate = TableUpdate<'conversations'>
