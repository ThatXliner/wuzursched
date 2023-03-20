export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      classes: {
        Row: {
          id: string
          name: string
          room: string
          teacher_first: string
          teacher_last: string
        }
        Insert: {
          id?: string
          name: string
          room: string
          teacher_first: string
          teacher_last: string
        }
        Update: {
          id?: string
          name?: string
          room?: string
          teacher_first?: string
          teacher_last?: string
        }
      }
      rooms: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
      }
      schedules: {
        Row: {
          "1a": string
          "1b": string
          "2a": string
          "2b": string
          "3a": string
          "3b": string
          "4a": string
          "4b": string
          room: string
          student: string
        }
        Insert: {
          "1a": string
          "1b": string
          "2a": string
          "2b": string
          "3a": string
          "3b": string
          "4a": string
          "4b": string
          room: string
          student: string
        }
        Update: {
          "1a"?: string
          "1b"?: string
          "2a"?: string
          "2b"?: string
          "3a"?: string
          "3b"?: string
          "4a"?: string
          "4b"?: string
          room?: string
          student?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
