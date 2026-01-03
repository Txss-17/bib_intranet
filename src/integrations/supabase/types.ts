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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          pole_id: Database["public"]["Enums"]["pole_id"] | null
          resource: string
          resource_id: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          pole_id?: Database["public"]["Enums"]["pole_id"] | null
          resource: string
          resource_id?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          pole_id?: Database["public"]["Enums"]["pole_id"] | null
          resource?: string
          resource_id?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      external_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          responded_at: string | null
          responded_by: string | null
          response_content: string | null
          routed_to_pole: Database["public"]["Enums"]["pole_id"] | null
          sender_email: string
          sender_name: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          subject: string
          updated_at: string | null
          validated_by: string | null
          validation_notes: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          responded_at?: string | null
          responded_by?: string | null
          response_content?: string | null
          routed_to_pole?: Database["public"]["Enums"]["pole_id"] | null
          sender_email: string
          sender_name?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          subject: string
          updated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          responded_at?: string | null
          responded_by?: string | null
          response_content?: string | null
          routed_to_pole?: Database["public"]["Enums"]["pole_id"] | null
          sender_email?: string
          sender_name?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          subject?: string
          updated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Relationships: []
      }
      inter_pole_messages: {
        Row: {
          content: string
          created_at: string | null
          from_pole: Database["public"]["Enums"]["pole_id"]
          from_user_id: string | null
          id: string
          priority: string | null
          read: boolean | null
          subject: string
          to_pole: Database["public"]["Enums"]["pole_id"]
        }
        Insert: {
          content: string
          created_at?: string | null
          from_pole: Database["public"]["Enums"]["pole_id"]
          from_user_id?: string | null
          id?: string
          priority?: string | null
          read?: boolean | null
          subject: string
          to_pole: Database["public"]["Enums"]["pole_id"]
        }
        Update: {
          content?: string
          created_at?: string | null
          from_pole?: Database["public"]["Enums"]["pole_id"]
          from_user_id?: string | null
          id?: string
          priority?: string | null
          read?: boolean | null
          subject?: string
          to_pole?: Database["public"]["Enums"]["pole_id"]
        }
        Relationships: []
      }
      message_routing_log: {
        Row: {
          action: string
          created_at: string | null
          from_status: Database["public"]["Enums"]["message_status"] | null
          id: string
          message_id: string | null
          notes: string | null
          performed_by: string | null
          to_status: Database["public"]["Enums"]["message_status"] | null
        }
        Insert: {
          action: string
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["message_status"] | null
          id?: string
          message_id?: string | null
          notes?: string | null
          performed_by?: string | null
          to_status?: Database["public"]["Enums"]["message_status"] | null
        }
        Update: {
          action?: string
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["message_status"] | null
          id?: string
          message_id?: string | null
          notes?: string | null
          performed_by?: string | null
          to_status?: Database["public"]["Enums"]["message_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "message_routing_log_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "external_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          pole_id: Database["public"]["Enums"]["pole_id"] | null
          read: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"] | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          pole_id?: Database["public"]["Enums"]["pole_id"] | null
          read?: boolean | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          pole_id?: Database["public"]["Enums"]["pole_id"] | null
          read?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          poles: Database["public"]["Enums"]["pole_id"][] | null
          seniority: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          poles?: Database["public"]["Enums"]["pole_id"][] | null
          seniority?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          poles?: Database["public"]["Enums"]["pole_id"][] | null
          seniority?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      whistleblower_submissions: {
        Row: {
          assigned_auditor_id: string | null
          category: string
          created_at: string | null
          encrypted_content: string
          id: string
          resolution_notes: string | null
          severity: string | null
          status: Database["public"]["Enums"]["whistleblower_status"] | null
          submission_code: string
          updated_at: string | null
        }
        Insert: {
          assigned_auditor_id?: string | null
          category: string
          created_at?: string | null
          encrypted_content: string
          id?: string
          resolution_notes?: string | null
          severity?: string | null
          status?: Database["public"]["Enums"]["whistleblower_status"] | null
          submission_code: string
          updated_at?: string | null
        }
        Update: {
          assigned_auditor_id?: string | null
          category?: string
          created_at?: string | null
          encrypted_content?: string
          id?: string
          resolution_notes?: string | null
          severity?: string | null
          status?: Database["public"]["Enums"]["whistleblower_status"] | null
          submission_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      whistleblower_updates: {
        Row: {
          created_at: string | null
          id: string
          is_auditor_update: boolean | null
          submission_id: string | null
          update_text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_auditor_update?: boolean | null
          submission_id?: string | null
          update_text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_auditor_update?: boolean | null
          submission_id?: string | null
          update_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "whistleblower_updates_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "whistleblower_submissions"
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
      app_role:
        | "admin"
        | "executive"
        | "manager"
        | "analyst"
        | "operator"
        | "viewer"
      message_status:
        | "pending"
        | "validated"
        | "routed"
        | "responded"
        | "archived"
      notification_type: "info" | "warning" | "success" | "critical"
      pole_id:
        | "direction"
        | "finance"
        | "ops"
        | "tech"
        | "rh"
        | "supplier"
        | "audit"
        | "compliance"
        | "rse"
        | "marketing"
        | "risk"
        | "lifecycle"
      whistleblower_status:
        | "pending"
        | "under_review"
        | "investigating"
        | "resolved"
        | "closed"
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
      app_role: [
        "admin",
        "executive",
        "manager",
        "analyst",
        "operator",
        "viewer",
      ],
      message_status: [
        "pending",
        "validated",
        "routed",
        "responded",
        "archived",
      ],
      notification_type: ["info", "warning", "success", "critical"],
      pole_id: [
        "direction",
        "finance",
        "ops",
        "tech",
        "rh",
        "supplier",
        "audit",
        "compliance",
        "rse",
        "marketing",
        "risk",
        "lifecycle",
      ],
      whistleblower_status: [
        "pending",
        "under_review",
        "investigating",
        "resolved",
        "closed",
      ],
    },
  },
} as const
