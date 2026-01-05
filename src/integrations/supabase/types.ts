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
      bugs: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string
          environment: string | null
          id: string
          reported_by: string | null
          resolution: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          steps_to_reproduce: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description: string
          environment?: string | null
          id?: string
          reported_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          steps_to_reproduce?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          environment?: string | null
          id?: string
          reported_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          steps_to_reproduce?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cashflows: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          recorded_by: string | null
          reference: string | null
          transaction_date: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          recorded_by?: string | null
          reference?: string | null
          transaction_date: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          recorded_by?: string | null
          reference?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          certificate_number: string | null
          created_at: string
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuer: string | null
          name: string
          product_id: string | null
          status: string
          supplier_id: string | null
          type: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          certificate_number?: string | null
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name: string
          product_id?: string | null
          status?: string
          supplier_id?: string | null
          type: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          certificate_number?: string | null
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name?: string
          product_id?: string | null
          status?: string
          supplier_id?: string | null
          type?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      deployments: {
        Row: {
          changelog: string | null
          created_at: string | null
          deployed_at: string | null
          deployed_by: string | null
          environment: string
          id: string
          rollback_at: string | null
          status: string | null
          version: string
        }
        Insert: {
          changelog?: string | null
          created_at?: string | null
          deployed_at?: string | null
          deployed_by?: string | null
          environment: string
          id?: string
          rollback_at?: string | null
          status?: string | null
          version: string
        }
        Update: {
          changelog?: string | null
          created_at?: string | null
          deployed_at?: string | null
          deployed_by?: string | null
          environment?: string
          id?: string
          rollback_at?: string | null
          status?: string | null
          version?: string
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
      field_audits: {
        Row: {
          audit_type: string
          auditor_id: string | null
          completed_date: string | null
          created_at: string | null
          findings: string | null
          id: string
          recommendations: string | null
          scheduled_date: string | null
          score: number | null
          status: string | null
          target_id: string | null
          target_name: string | null
          target_type: string
          updated_at: string | null
        }
        Insert: {
          audit_type: string
          auditor_id?: string | null
          completed_date?: string | null
          created_at?: string | null
          findings?: string | null
          id?: string
          recommendations?: string | null
          scheduled_date?: string | null
          score?: number | null
          status?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type: string
          updated_at?: string | null
        }
        Update: {
          audit_type?: string
          auditor_id?: string | null
          completed_date?: string | null
          created_at?: string | null
          findings?: string | null
          id?: string
          recommendations?: string | null
          scheduled_date?: string | null
          score?: number | null
          status?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string
          updated_at?: string | null
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
      logistics_incidents: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string
          id: string
          incident_type: string
          order_id: string | null
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description: string
          id?: string
          incident_type: string
          order_id?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          id?: string
          incident_type?: string
          order_id?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_incidents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_partners: {
        Row: {
          api_integrated: boolean | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          api_integrated?: boolean | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          api_integrated?: boolean | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
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
      orders: {
        Row: {
          created_at: string | null
          currency: string | null
          delivered_at: string | null
          id: string
          order_number: string
          ordered_at: string | null
          shipped_at: string | null
          shipping_address: string | null
          shipping_method: string | null
          status: string | null
          total_amount: number | null
          tracking_number: string | null
          updated_at: string | null
          user_account_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          delivered_at?: string | null
          id?: string
          order_number: string
          ordered_at?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_method?: string | null
          status?: string | null
          total_amount?: number | null
          tracking_number?: string | null
          updated_at?: string | null
          user_account_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          delivered_at?: string | null
          id?: string
          order_number?: string
          ordered_at?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_method?: string | null
          status?: string | null
          total_amount?: number | null
          tracking_number?: string | null
          updated_at?: string | null
          user_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_account_id_fkey"
            columns: ["user_account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging_submissions: {
        Row: {
          co2_footprint: number | null
          created_at: string | null
          id: string
          material: string | null
          packaging_type: string
          product_id: string | null
          recyclable: boolean | null
          recycling_percentage: number | null
          status: string | null
          submitted_by: string | null
          supplier_id: string | null
          updated_at: string | null
          validated_by: string | null
          validation_notes: string | null
        }
        Insert: {
          co2_footprint?: number | null
          created_at?: string | null
          id?: string
          material?: string | null
          packaging_type: string
          product_id?: string | null
          recyclable?: boolean | null
          recycling_percentage?: number | null
          status?: string | null
          submitted_by?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Update: {
          co2_footprint?: number | null
          created_at?: string | null
          id?: string
          material?: string | null
          packaging_type?: string
          product_id?: string | null
          recyclable?: boolean | null
          recycling_percentage?: number | null
          status?: string | null
          submitted_by?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packaging_submissions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaging_submissions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_decisions: {
        Row: {
          decision_at: string
          decision_by: string
          decision_type: string
          details: Json | null
          id: string
          new_status: string | null
          previous_status: string | null
          product_id: string
          reason: string
        }
        Insert: {
          decision_at?: string
          decision_by: string
          decision_type: string
          details?: Json | null
          id?: string
          new_status?: string | null
          previous_status?: string | null
          product_id: string
          reason: string
        }
        Update: {
          decision_at?: string
          decision_by?: string
          decision_type?: string
          details?: Json | null
          id?: string
          new_status?: string | null
          previous_status?: string | null
          product_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_decisions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          moq: number | null
          name: string
          packaging_status: string | null
          rejection_reason: string | null
          sku: string | null
          status: string
          supplier_id: string
          unit_price: number | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          moq?: number | null
          name: string
          packaging_status?: string | null
          rejection_reason?: string | null
          sku?: string | null
          status?: string
          supplier_id: string
          unit_price?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          moq?: number | null
          name?: string
          packaging_status?: string | null
          rejection_reason?: string | null
          sku?: string | null
          status?: string
          supplier_id?: string
          unit_price?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
          position: Database["public"]["Enums"]["employee_position"] | null
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
          position?: Database["public"]["Enums"]["employee_position"] | null
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
          position?: Database["public"]["Enums"]["employee_position"] | null
          seniority?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quality_alerts: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          product_id: string | null
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
          supplier_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          product_id?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity: string
          status?: string
          supplier_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          product_id?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          supplier_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_alerts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_name: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          risk_score: number | null
          status: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          risk_score?: number | null
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          risk_score?: number | null
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string
          id: string
          priority: string | null
          resolution: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_account_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_account_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_account_id_fkey"
            columns: ["user_account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_accounts: {
        Row: {
          company_name: string
          contact_email: string
          contact_name: string | null
          created_at: string | null
          id: string
          last_order_date: string | null
          notes: string | null
          payment_status: string | null
          revenue: number | null
          risk_level: string | null
          stock_engaged: number | null
          subscription_status: string | null
          trustpilot_rating: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_name: string
          contact_email: string
          contact_name?: string | null
          created_at?: string | null
          id?: string
          last_order_date?: string | null
          notes?: string | null
          payment_status?: string | null
          revenue?: number | null
          risk_level?: string | null
          stock_engaged?: number | null
          subscription_status?: string | null
          trustpilot_rating?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string
          contact_name?: string | null
          created_at?: string | null
          id?: string
          last_order_date?: string | null
          notes?: string | null
          payment_status?: string | null
          revenue?: number | null
          risk_level?: string | null
          stock_engaged?: number | null
          subscription_status?: string | null
          trustpilot_rating?: number | null
          updated_at?: string | null
          user_id?: string | null
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
      employee_position:
        | "supplier_manager"
        | "user_success_manager"
        | "ops_logistics_manager"
        | "finance_manager"
        | "audit_compliance_lead"
        | "rse_packaging_manager"
        | "tech_platform_manager"
        | "ceo"
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
      employee_position: [
        "supplier_manager",
        "user_success_manager",
        "ops_logistics_manager",
        "finance_manager",
        "audit_compliance_lead",
        "rse_packaging_manager",
        "tech_platform_manager",
        "ceo",
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
