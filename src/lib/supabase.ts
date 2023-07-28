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
        Relationships: [
          {
            foreignKeyName: "classes_room_fkey"
            columns: ["room"]
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "schedules_1a_fkey"
            columns: ["1a"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_1b_fkey"
            columns: ["1b"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_2a_fkey"
            columns: ["2a"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_2b_fkey"
            columns: ["2b"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_3a_fkey"
            columns: ["3a"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_3b_fkey"
            columns: ["3b"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_4a_fkey"
            columns: ["4a"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_4b_fkey"
            columns: ["4b"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_room_fkey"
            columns: ["room"]
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
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
