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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      children: {
        Row: {
          birth_date: string | null
          created_at: string
          feeding: string | null
          id: string
          name: string
          professional: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          feeding?: string | null
          id?: string
          name: string
          professional?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          feeding?: string | null
          id?: string
          name?: string
          professional?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      diaper_records: {
        Row: {
          blood: Database["public"]["Enums"]["diaper_blood"]
          child_id: string
          consistency: Database["public"]["Enums"]["diaper_consistency"] | null
          created_at: string
          id: string
          mucus: Database["public"]["Enums"]["diaper_mucus"]
          note: string | null
          occurred_at: string
          protocol_id: string | null
          stage: number | null
          user_id: string
        }
        Insert: {
          blood?: Database["public"]["Enums"]["diaper_blood"]
          child_id: string
          consistency?: Database["public"]["Enums"]["diaper_consistency"] | null
          created_at?: string
          id?: string
          mucus?: Database["public"]["Enums"]["diaper_mucus"]
          note?: string | null
          occurred_at: string
          protocol_id?: string | null
          stage?: number | null
          user_id: string
        }
        Update: {
          blood?: Database["public"]["Enums"]["diaper_blood"]
          child_id?: string
          consistency?: Database["public"]["Enums"]["diaper_consistency"] | null
          created_at?: string
          id?: string
          mucus?: Database["public"]["Enums"]["diaper_mucus"]
          note?: string | null
          occurred_at?: string
          protocol_id?: string | null
          stage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diaper_records_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diaper_records_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      environment_records: {
        Row: {
          child_id: string
          created_at: string
          different: string | null
          id: string
          note: string | null
          occurred_at: string
          place: string
          protocol_id: string | null
          stage: number | null
          user_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          different?: string | null
          id?: string
          note?: string | null
          occurred_at: string
          place: string
          protocol_id?: string | null
          stage?: number | null
          user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          different?: string | null
          id?: string
          note?: string | null
          occurred_at?: string
          place?: string
          protocol_id?: string | null
          stage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "environment_records_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environment_records_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      exposures: {
        Row: {
          amount: Database["public"]["Enums"]["exposure_amount"] | null
          brand: string | null
          child_id: string
          consumer: Database["public"]["Enums"]["food_consumer"]
          created_at: string
          details: string | null
          food: string
          id: string
          note: string | null
          occurred_at: string
          protocol_id: string | null
          stage: number | null
          user_id: string
        }
        Insert: {
          amount?: Database["public"]["Enums"]["exposure_amount"] | null
          brand?: string | null
          child_id: string
          consumer?: Database["public"]["Enums"]["food_consumer"]
          created_at?: string
          details?: string | null
          food: string
          id?: string
          note?: string | null
          occurred_at: string
          protocol_id?: string | null
          stage?: number | null
          user_id: string
        }
        Update: {
          amount?: Database["public"]["Enums"]["exposure_amount"] | null
          brand?: string | null
          child_id?: string
          consumer?: Database["public"]["Enums"]["food_consumer"]
          created_at?: string
          details?: string | null
          food?: string
          id?: string
          note?: string | null
          occurred_at?: string
          protocol_id?: string | null
          stage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exposures_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exposures_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          child_id: string
          created_at: string
          data: Json
          id: string
          kind: string
          note: string | null
          occurred_at: string
          protocol_id: string | null
          stage: number | null
          title: string | null
          user_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          data?: Json
          id?: string
          kind: string
          note?: string | null
          occurred_at: string
          protocol_id?: string | null
          stage?: number | null
          title?: string | null
          user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          data?: Json
          id?: string
          kind?: string
          note?: string | null
          occurred_at?: string
          protocol_id?: string | null
          stage?: number | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_records_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          child_id: string
          content: string
          created_at: string
          id: string
          occurred_at: string
          protocol_id: string | null
          stage: number | null
          user_id: string
        }
        Insert: {
          child_id: string
          content: string
          created_at?: string
          id?: string
          occurred_at: string
          protocol_id?: string | null
          stage?: number | null
          user_id: string
        }
        Update: {
          child_id?: string
          content?: string
          created_at?: string
          id?: string
          occurred_at?: string
          protocol_id?: string | null
          stage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      product_records: {
        Row: {
          brand: string | null
          category: string
          child_id: string
          created_at: string
          id: string
          is_new: boolean | null
          name: string | null
          note: string | null
          occurred_at: string
          protocol_id: string | null
          stage: number | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          category: string
          child_id: string
          created_at?: string
          id?: string
          is_new?: boolean | null
          name?: string | null
          note?: string | null
          occurred_at: string
          protocol_id?: string | null
          stage?: number | null
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string
          child_id?: string
          created_at?: string
          id?: string
          is_new?: boolean | null
          name?: string | null
          note?: string | null
          occurred_at?: string
          protocol_id?: string | null
          stage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_records_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_records_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      protocols: {
        Row: {
          child_id: string
          created_at: string
          current_stage: number
          ended_at: string | null
          id: string
          professional: string | null
          reason: string | null
          started_at: string
          status: Database["public"]["Enums"]["protocol_status"]
          title: string | null
          user_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          current_stage?: number
          ended_at?: string | null
          id?: string
          professional?: string | null
          reason?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["protocol_status"]
          title?: string | null
          user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          current_stage?: number
          ended_at?: string | null
          id?: string
          professional?: string | null
          reason?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["protocol_status"]
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocols_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_history: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          note: string | null
          outcome: Database["public"]["Enums"]["stage_outcome"] | null
          protocol_id: string
          stage: number
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          note?: string | null
          outcome?: Database["public"]["Enums"]["stage_outcome"] | null
          protocol_id: string
          stage: number
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          note?: string | null
          outcome?: Database["public"]["Enums"]["stage_outcome"] | null
          protocol_id?: string
          stage?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_history_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      symptom_event_items: {
        Row: {
          code: string
          created_at: string
          id: string
          intensity: number
          symptom_event_id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          intensity: number
          symptom_event_id: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          intensity?: number
          symptom_event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "symptom_event_items_symptom_event_id_fkey"
            columns: ["symptom_event_id"]
            isOneToOne: false
            referencedRelation: "symptom_events"
            referencedColumns: ["id"]
          },
        ]
      }
      symptom_events: {
        Row: {
          child_id: string
          created_at: string
          exposure_id: string | null
          id: string
          no_symptoms: boolean
          note: string | null
          occurred_at: string
          protocol_id: string | null
          stage: number | null
          user_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          exposure_id?: string | null
          id?: string
          no_symptoms?: boolean
          note?: string | null
          occurred_at: string
          protocol_id?: string | null
          stage?: number | null
          user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          exposure_id?: string | null
          id?: string
          no_symptoms?: boolean
          note?: string | null
          occurred_at?: string
          protocol_id?: string | null
          stage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "symptom_events_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "symptom_events_exposure_id_fkey"
            columns: ["exposure_id"]
            isOneToOne: false
            referencedRelation: "exposures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "symptom_events_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      tpo_stages: {
        Row: {
          label: string
          ordinal: number
          short_explanation: string | null
          why_this_stage: string | null
        }
        Insert: {
          label: string
          ordinal: number
          short_explanation?: string | null
          why_this_stage?: string | null
        }
        Update: {
          label?: string
          ordinal?: number
          short_explanation?: string | null
          why_this_stage?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      change_stage: {
        Args: {
          p_at?: string
          p_note?: string
          p_outcome: Database["public"]["Enums"]["stage_outcome"]
          p_protocol_id: string
        }
        Returns: number
      }
      create_onboarding: {
        Args: {
          p_birth_date?: string
          p_child_name: string
          p_feeding?: string
          p_professional?: string
          p_reason?: string
          p_started_at?: string
        }
        Returns: string
      }
      create_symptom_event: {
        Args: {
          p_child_id: string
          p_exposure_id?: string
          p_items?: Json
          p_no_symptoms?: boolean
          p_note?: string
          p_occurred_at?: string
          p_protocol_id?: string
        }
        Returns: string
      }
      owns_child: { Args: { p_child_id: string }; Returns: boolean }
      owns_exposure: { Args: { p_exposure_id: string }; Returns: boolean }
      owns_protocol: { Args: { p_protocol_id: string }; Returns: boolean }
      owns_symptom_event: { Args: { p_event_id: string }; Returns: boolean }
      start_tpo: {
        Args: { p_child_id: string; p_note?: string; p_started_at?: string }
        Returns: string
      }
    }
    Enums: {
      diaper_blood: "nao" | "tracos" | "visivel"
      diaper_consistency:
        | "habitual"
        | "liquida"
        | "pastosa"
        | "ressecada"
        | "nao_sei"
      diaper_mucus: "nao" | "pouco" | "moderado" | "muito"
      exposure_amount: "pequena" | "habitual" | "maior" | "nao_sei"
      food_consumer: "mother" | "child"
      protocol_status: "active" | "paused" | "finished"
      stage_outcome: "advanced" | "repeated" | "returned" | "paused"
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
      diaper_blood: ["nao", "tracos", "visivel"],
      diaper_consistency: [
        "habitual",
        "liquida",
        "pastosa",
        "ressecada",
        "nao_sei",
      ],
      diaper_mucus: ["nao", "pouco", "moderado", "muito"],
      exposure_amount: ["pequena", "habitual", "maior", "nao_sei"],
      food_consumer: ["mother", "child"],
      protocol_status: ["active", "paused", "finished"],
      stage_outcome: ["advanced", "repeated", "returned", "paused"],
    },
  },
} as const
