export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      breakout_room_participants: {
        Row: {
          breakout_room_id: string
          id: string
          joined_at: string
          left_at: string | null
          user_id: string
        }
        Insert: {
          breakout_room_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          user_id: string
        }
        Update: {
          breakout_room_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breakout_room_participants_breakout_room_id_fkey"
            columns: ["breakout_room_id"]
            isOneToOne: false
            referencedRelation: "breakout_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      breakout_rooms: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          meeting_id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          meeting_id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          meeting_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "breakout_rooms_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          meeting_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          meeting_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          meeting_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_analytics: {
        Row: {
          created_at: string
          hand_raises_count: number | null
          id: string
          joined_at: string | null
          left_at: string | null
          meeting_id: string
          messages_count: number | null
          reactions_count: number | null
          total_talk_time_seconds: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          hand_raises_count?: number | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          meeting_id: string
          messages_count?: number | null
          reactions_count?: number | null
          total_talk_time_seconds?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          hand_raises_count?: number | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          meeting_id?: string
          messages_count?: number | null
          reactions_count?: number | null
          total_talk_time_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_analytics_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_invitations: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string
          meeting_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by: string
          meeting_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          meeting_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_invitations_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          created_at: string
          id: string
          invite_status: string | null
          is_invited: boolean | null
          joined_at: string | null
          left_at: string | null
          meeting_id: string
          role: Database["public"]["Enums"]["participant_role"]
          user_id: string
          waiting_room_status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invite_status?: string | null
          is_invited?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          meeting_id: string
          role?: Database["public"]["Enums"]["participant_role"]
          user_id: string
          waiting_room_status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invite_status?: string | null
          is_invited?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          meeting_id?: string
          role?: Database["public"]["Enums"]["participant_role"]
          user_id?: string
          waiting_room_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_polls: {
        Row: {
          allow_multiple: boolean
          created_at: string
          created_by: string
          ended_at: string | null
          id: string
          is_active: boolean
          is_anonymous: boolean
          meeting_id: string
          options: Json
          question: string
        }
        Insert: {
          allow_multiple?: boolean
          created_at?: string
          created_by: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          is_anonymous?: boolean
          meeting_id: string
          options?: Json
          question: string
        }
        Update: {
          allow_multiple?: boolean
          created_at?: string
          created_by?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          is_anonymous?: boolean
          meeting_id?: string
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_polls_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          asked_by: string
          created_at: string
          id: string
          is_answered: boolean
          is_pinned: boolean
          meeting_id: string
          question: string
          upvotes: number
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          asked_by: string
          created_at?: string
          id?: string
          is_answered?: boolean
          is_pinned?: boolean
          meeting_id: string
          question: string
          upvotes?: number
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          asked_by?: string
          created_at?: string
          id?: string
          is_answered?: boolean
          is_pinned?: boolean
          meeting_id?: string
          question?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "meeting_questions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_reactions: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_reactions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_recordings: {
        Row: {
          created_at: string
          duration_seconds: number | null
          file_size_bytes: number | null
          file_url: string
          id: string
          meeting_id: string
          recorded_by: string
          status: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          file_url: string
          id?: string
          meeting_id: string
          recorded_by: string
          status?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          meeting_id?: string
          recorded_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_recordings_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_summaries: {
        Row: {
          action_items: Json
          created_at: string
          generated_at: string
          id: string
          key_points: Json
          meeting_id: string
          summary: string
        }
        Insert: {
          action_items?: Json
          created_at?: string
          generated_at?: string
          id?: string
          key_points?: Json
          meeting_id: string
          summary: string
        }
        Update: {
          action_items?: Json
          created_at?: string
          generated_at?: string
          id?: string
          key_points?: Json
          meeting_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_summaries_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: true
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          host_id: string
          id: string
          is_recurring: boolean | null
          meeting_code: string
          password: string | null
          recurring_pattern: Json | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["meeting_status"]
          title: string
          updated_at: string
          waiting_room_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          host_id: string
          id?: string
          is_recurring?: boolean | null
          meeting_code: string
          password?: string | null
          recurring_pattern?: Json | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["meeting_status"]
          title: string
          updated_at?: string
          waiting_room_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          host_id?: string
          id?: string
          is_recurring?: boolean | null
          meeting_code?: string
          password?: string | null
          recurring_pattern?: Json | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["meeting_status"]
          title?: string
          updated_at?: string
          waiting_room_enabled?: boolean | null
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "meeting_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_upvotes: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_upvotes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "meeting_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      signaling: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          payload: Json
          recipient_id: string | null
          sender_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          payload: Json
          recipient_id?: string | null
          sender_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          payload?: Json
          recipient_id?: string | null
          sender_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "signaling_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      transcriptions: {
        Row: {
          content: string
          created_at: string
          id: string
          meeting_id: string
          speaker_id: string
          timestamp_end: number | null
          timestamp_start: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          meeting_id: string
          speaker_id: string
          timestamp_end?: number | null
          timestamp_start: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          meeting_id?: string
          speaker_id?: string
          timestamp_end?: number | null
          timestamp_start?: number
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_meeting_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_meeting_host: {
        Args: { _meeting_id: string; _user_id: string }
        Returns: boolean
      }
      is_meeting_participant: {
        Args: { _meeting_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      meeting_status: "scheduled" | "active" | "ended" | "cancelled"
      participant_role: "host" | "co-host" | "participant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      meeting_status: ["scheduled", "active", "ended", "cancelled"],
      participant_role: ["host", "co-host", "participant"],
    },
  },
} as const
