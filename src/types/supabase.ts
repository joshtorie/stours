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
      artists: {
        Row: {
          id: string
          name: string
          bio: string
          hero_image: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          bio: string
          hero_image: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          bio?: string
          hero_image?: string
          created_at?: string
        }
      }
      cities: {
        Row: {
          id: string
          name: string
          hero_image: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          hero_image: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          hero_image?: string
          created_at?: string
        }
      }
      neighborhoods: {
        Row: {
          id: string
          name: string
          city_id: string
          hero_image: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          city_id: string
          hero_image: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          city_id?: string
          hero_image?: string
          created_at?: string
        }
      }
      street_art: {
        Row: {
          id: string
          title: string
          description: string
          image: string
          artist_id: string
          neighborhood_id: string
          latitude: number
          longitude: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          image: string
          artist_id: string
          neighborhood_id: string
          latitude: number
          longitude: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image?: string
          artist_id?: string
          neighborhood_id?: string
          latitude?: number
          longitude?: number
          created_at?: string
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