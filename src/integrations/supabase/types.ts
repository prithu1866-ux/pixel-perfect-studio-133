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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      animals: {
        Row: {
          age_months: number | null
          breed: string | null
          created_at: string
          health_status: string
          id: string
          name: string
          notes: string | null
          owner_id: string
          sex: string | null
          species: string
          tag_id: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          age_months?: number | null
          breed?: string | null
          created_at?: string
          health_status?: string
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          sex?: string | null
          species: string
          tag_id?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          age_months?: number | null
          breed?: string | null
          created_at?: string
          health_status?: string
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          sex?: string | null
          species?: string
          tag_id?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      assessments: {
        Row: {
          advice: string | null
          created_at: string
          follow_up_date: string | null
          id: string
          provisional_diagnosis: string
          report_id: string
          treatment: string | null
          vet_id: string
        }
        Insert: {
          advice?: string | null
          created_at?: string
          follow_up_date?: string | null
          id?: string
          provisional_diagnosis: string
          report_id: string
          treatment?: string | null
          vet_id: string
        }
        Update: {
          advice?: string | null
          created_at?: string
          follow_up_date?: string | null
          id?: string
          provisional_diagnosis?: string
          report_id?: string
          treatment?: string | null
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "symptom_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          district: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string
          state: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          created_at?: string
          district?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string
          state?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          created_at?: string
          district?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          state?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      symptom_reports: {
        Row: {
          affected_count: number
          animal_id: string
          client_id: string | null
          created_at: string
          district: string | null
          duration_days: number | null
          id: string
          notes: string | null
          owner_id: string
          risk_level: string
          risk_score: number
          status: string
          suspected_conditions: string[]
          symptoms: string[]
          temperature_c: number | null
          triage_reasons: Json
          updated_at: string
        }
        Insert: {
          affected_count?: number
          animal_id: string
          client_id?: string | null
          created_at?: string
          district?: string | null
          duration_days?: number | null
          id?: string
          notes?: string | null
          owner_id: string
          risk_level: string
          risk_score?: number
          status?: string
          suspected_conditions?: string[]
          symptoms?: string[]
          temperature_c?: number | null
          triage_reasons?: Json
          updated_at?: string
        }
        Update: {
          affected_count?: number
          animal_id?: string
          client_id?: string | null
          created_at?: string
          district?: string | null
          duration_days?: number | null
          id?: string
          notes?: string | null
          owner_id?: string
          risk_level?: string
          risk_score?: number
          status?: string
          suspected_conditions?: string[]
          symptoms?: string[]
          temperature_c?: number | null
          triage_reasons?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "symptom_reports_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vaccinations: {
        Row: {
          administered_by: string | null
          administered_on: string | null
          animal_id: string
          created_at: string
          disease: string | null
          id: string
          next_due_on: string | null
          notes: string | null
          owner_id: string
          vaccine: string
        }
        Insert: {
          administered_by?: string | null
          administered_on?: string | null
          animal_id: string
          created_at?: string
          disease?: string | null
          id?: string
          next_due_on?: string | null
          notes?: string | null
          owner_id: string
          vaccine: string
        }
        Update: {
          administered_by?: string | null
          administered_on?: string | null
          animal_id?: string
          created_at?: string
          disease?: string | null
          id?: string
          next_due_on?: string | null
          notes?: string | null
          owner_id?: string
          vaccine?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "farmer" | "veterinarian" | "field_worker" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["farmer", "veterinarian", "field_worker", "admin"],
    },
  },
} as const
