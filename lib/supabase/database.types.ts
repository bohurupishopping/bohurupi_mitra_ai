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
      // Add your Supabase tables here
    }
    Views: {
      // Add your views here if you have any
    }
    Functions: {
      // Add your functions here if you have any
    }
    Enums: {
      // Add your enums here if you have any
    }
  }
} 