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
      auth_logs: {
        Row: {
          app_origin: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          app_origin?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          app_origin?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
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
      demand_forecasts: {
        Row: {
          avg_daily_sales_7d: number
          catalog_id: string
          computed_at: string
          confidence_level: string | null
          id: string
          projected_sales_7d: number
          region: string | null
          sample_size: number | null
          trend_percent: number
        }
        Insert: {
          avg_daily_sales_7d?: number
          catalog_id: string
          computed_at?: string
          confidence_level?: string | null
          id?: string
          projected_sales_7d?: number
          region?: string | null
          sample_size?: number | null
          trend_percent?: number
        }
        Update: {
          avg_daily_sales_7d?: number
          catalog_id?: string
          computed_at?: string
          confidence_level?: string | null
          id?: string
          projected_sales_7d?: number
          region?: string | null
          sample_size?: number | null
          trend_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "demand_forecasts_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
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
      documents: {
        Row: {
          access_level: string
          created_at: string | null
          file_size: number | null
          file_url: string | null
          id: string
          modified_by: string | null
          name: string
          pole_id: Database["public"]["Enums"]["pole_id"] | null
          status: string
          type: string
          updated_at: string | null
          uploaded_by: string | null
          version: string
        }
        Insert: {
          access_level?: string
          created_at?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          modified_by?: string | null
          name: string
          pole_id?: Database["public"]["Enums"]["pole_id"] | null
          status?: string
          type?: string
          updated_at?: string | null
          uploaded_by?: string | null
          version?: string
        }
        Update: {
          access_level?: string
          created_at?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          modified_by?: string | null
          name?: string
          pole_id?: Database["public"]["Enums"]["pole_id"] | null
          status?: string
          type?: string
          updated_at?: string | null
          uploaded_by?: string | null
          version?: string
        }
        Relationships: []
      }
      edge_function_logs: {
        Row: {
          app_origin: string | null
          caller_id: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          function_name: string
          http_status: number | null
          id: string
          metadata: Json | null
          status: string
        }
        Insert: {
          app_origin?: string | null
          caller_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          function_name: string
          http_status?: number | null
          id?: string
          metadata?: Json | null
          status?: string
        }
        Update: {
          app_origin?: string | null
          caller_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          function_name?: string
          http_status?: number | null
          id?: string
          metadata?: Json | null
          status?: string
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
      feed_posts: {
        Row: {
          author_id: string | null
          author_name: string
          author_role: string
          comments: number | null
          content: string
          created_at: string | null
          id: string
          pole_id: Database["public"]["Enums"]["pole_id"] | null
          reactions: number | null
          title: string
          type: string
          updated_at: string | null
          visibility: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          author_role?: string
          comments?: number | null
          content: string
          created_at?: string | null
          id?: string
          pole_id?: Database["public"]["Enums"]["pole_id"] | null
          reactions?: number | null
          title: string
          type?: string
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          author_role?: string
          comments?: number | null
          content?: string
          created_at?: string | null
          id?: string
          pole_id?: Database["public"]["Enums"]["pole_id"] | null
          reactions?: number | null
          title?: string
          type?: string
          updated_at?: string | null
          visibility?: string
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
      fundraising_rounds: {
        Row: {
          close_date: string | null
          created_at: string | null
          id: string
          lead_investor: string | null
          name: string
          notes: string | null
          raised_amount: number | null
          start_date: string | null
          status: string | null
          target_amount: number
          updated_at: string | null
          valuation: number | null
        }
        Insert: {
          close_date?: string | null
          created_at?: string | null
          id?: string
          lead_investor?: string | null
          name: string
          notes?: string | null
          raised_amount?: number | null
          start_date?: string | null
          status?: string | null
          target_amount: number
          updated_at?: string | null
          valuation?: number | null
        }
        Update: {
          close_date?: string | null
          created_at?: string | null
          id?: string
          lead_investor?: string | null
          name?: string
          notes?: string | null
          raised_amount?: number | null
          start_date?: string | null
          status?: string | null
          target_amount?: number
          updated_at?: string | null
          valuation?: number | null
        }
        Relationships: []
      }
      guarantee_fund: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          processed_by: string | null
          reason: string
          related_user_id: string | null
          transaction_date: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_by?: string | null
          reason: string
          related_user_id?: string | null
          transaction_date: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_by?: string | null
          reason?: string
          related_user_id?: string | null
          transaction_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "guarantee_fund_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
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
          catalog_id: string | null
          category: string | null
          created_at: string | null
          description: string
          id: string
          incident_type: string
          order_id: string | null
          partner_id: string | null
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          catalog_id?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          incident_type: string
          order_id?: string | null
          partner_id?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          catalog_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          incident_type?: string
          order_id?: string | null
          partner_id?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_incidents_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_incidents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_incidents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "logistics_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_partners: {
        Row: {
          api_integrated: boolean | null
          avg_lead_time_hours: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          error_rate: number | null
          id: string
          name: string
          notes: string | null
          region: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          volume_processed: number | null
        }
        Insert: {
          api_integrated?: boolean | null
          avg_lead_time_hours?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          error_rate?: number | null
          id?: string
          name: string
          notes?: string | null
          region?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          volume_processed?: number | null
        }
        Update: {
          api_integrated?: boolean | null
          avg_lead_time_hours?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          error_rate?: number | null
          id?: string
          name?: string
          notes?: string | null
          region?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          volume_processed?: number | null
        }
        Relationships: []
      }
      media_attachments: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_size?: number
          file_type?: string
          file_url: string
          id?: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
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
      ops_audits: {
        Row: {
          auditor: string
          created_at: string | null
          date: string
          findings: string | null
          id: string
          notes: string | null
          process: string
          recommendations: number | null
          scope: string
          score: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          auditor?: string
          created_at?: string | null
          date?: string
          findings?: string | null
          id?: string
          notes?: string | null
          process: string
          recommendations?: number | null
          scope?: string
          score?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          auditor?: string
          created_at?: string | null
          date?: string
          findings?: string | null
          id?: string
          notes?: string | null
          process?: string
          recommendations?: number | null
          scope?: string
          score?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_lifecycle_events: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          notes: string | null
          order_id: string
          partner_id: string | null
          performed_by: string | null
          stage: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_id: string
          partner_id?: string | null
          performed_by?: string | null
          stage: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_id?: string
          partner_id?: string | null
          performed_by?: string | null
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_lifecycle_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lifecycle_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "logistics_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          catalog_id: string | null
          created_at: string | null
          currency: string | null
          current_stage: string | null
          delivered_at: string | null
          id: string
          order_number: string
          ordered_at: string | null
          partner_id: string | null
          region: string | null
          shipped_at: string | null
          shipping_address: string | null
          shipping_method: string | null
          shop_sku: string | null
          status: string | null
          total_amount: number | null
          tracking_number: string | null
          updated_at: string | null
          user_account_id: string | null
        }
        Insert: {
          catalog_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_stage?: string | null
          delivered_at?: string | null
          id?: string
          order_number: string
          ordered_at?: string | null
          partner_id?: string | null
          region?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_method?: string | null
          shop_sku?: string | null
          status?: string | null
          total_amount?: number | null
          tracking_number?: string | null
          updated_at?: string | null
          user_account_id?: string | null
        }
        Update: {
          catalog_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_stage?: string | null
          delivered_at?: string | null
          id?: string
          order_number?: string
          ordered_at?: string | null
          partner_id?: string | null
          region?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_method?: string | null
          shop_sku?: string | null
          status?: string | null
          total_amount?: number | null
          tracking_number?: string | null
          updated_at?: string | null
          user_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "logistics_partners"
            referencedColumns: ["id"]
          },
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
      partner_stocks: {
        Row: {
          catalog_id: string
          created_at: string
          id: string
          ideal_stock: number | null
          last_inventory_at: string | null
          location: string | null
          min_threshold: number | null
          partner_id: string
          quantity: number
          region: string | null
          reorder_threshold: number | null
          reserved_quantity: number
          rupture_threshold: number | null
          supplier_lead_time_days: number | null
          updated_at: string
        }
        Insert: {
          catalog_id: string
          created_at?: string
          id?: string
          ideal_stock?: number | null
          last_inventory_at?: string | null
          location?: string | null
          min_threshold?: number | null
          partner_id: string
          quantity?: number
          region?: string | null
          reorder_threshold?: number | null
          reserved_quantity?: number
          rupture_threshold?: number | null
          supplier_lead_time_days?: number | null
          updated_at?: string
        }
        Update: {
          catalog_id?: string
          created_at?: string
          id?: string
          ideal_stock?: number | null
          last_inventory_at?: string | null
          location?: string | null
          min_threshold?: number | null
          partner_id?: string
          quantity?: number
          region?: string | null
          reorder_threshold?: number | null
          reserved_quantity?: number
          rupture_threshold?: number | null
          supplier_lead_time_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_stocks_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_stocks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "logistics_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_sync_events: {
        Row: {
          created_at: string
          direction: string
          duration_ms: number | null
          error_message: string | null
          event_type: string
          id: string
          partner_id: string
          payload: Json | null
          reference_id: string | null
          reference_type: string | null
          status: string
        }
        Insert: {
          created_at?: string
          direction: string
          duration_ms?: number | null
          error_message?: string | null
          event_type: string
          id?: string
          partner_id: string
          payload?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          direction?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string
          id?: string
          partner_id?: string
          payload?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_sync_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "logistics_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_assignments: {
        Row: {
          assigned_at: string | null
          assigned_to_id: string | null
          assigned_to_name: string
          id: string
          portfolio_id: string | null
          supplier_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to_id?: string | null
          assigned_to_name?: string
          id?: string
          portfolio_id?: string | null
          supplier_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to_id?: string | null
          assigned_to_name?: string
          id?: string
          portfolio_id?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_assignments_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "supplier_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_assignments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_catalog: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string
          dimensions: string | null
          id: string
          internal_sku: string | null
          is_active: boolean | null
          moq: number | null
          name: string
          notes: string | null
          packaging_type: string | null
          product_id: string | null
          reorder_threshold: number | null
          shop_sku: string
          updated_at: string
          weight_gross_g: number | null
          weight_net_g: number | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          dimensions?: string | null
          id?: string
          internal_sku?: string | null
          is_active?: boolean | null
          moq?: number | null
          name: string
          notes?: string | null
          packaging_type?: string | null
          product_id?: string | null
          reorder_threshold?: number | null
          shop_sku: string
          updated_at?: string
          weight_gross_g?: number | null
          weight_net_g?: number | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          dimensions?: string | null
          id?: string
          internal_sku?: string | null
          is_active?: boolean | null
          moq?: number | null
          name?: string
          notes?: string | null
          packaging_type?: string | null
          product_id?: string | null
          reorder_threshold?: number | null
          shop_sku?: string
          updated_at?: string
          weight_gross_g?: number | null
          weight_net_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_catalog_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          barcode: string | null
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          dimensions: string | null
          gallery: string[] | null
          id: string
          image_url: string | null
          ingredients: string | null
          margin: number | null
          moq: number | null
          name: string
          origin: string | null
          packaging_status: string | null
          product_sheet_url: string | null
          rejection_reason: string | null
          selling_price: number | null
          shelf_life: string | null
          sku: string | null
          status: string
          supplier_id: string
          tech_integration_status: string | null
          transmitted_at: string | null
          transmitted_by: string | null
          unit_price: number | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          weight: string | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          dimensions?: string | null
          gallery?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          margin?: number | null
          moq?: number | null
          name: string
          origin?: string | null
          packaging_status?: string | null
          product_sheet_url?: string | null
          rejection_reason?: string | null
          selling_price?: number | null
          shelf_life?: string | null
          sku?: string | null
          status?: string
          supplier_id: string
          tech_integration_status?: string | null
          transmitted_at?: string | null
          transmitted_by?: string | null
          unit_price?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          weight?: string | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          dimensions?: string | null
          gallery?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          margin?: number | null
          moq?: number | null
          name?: string
          origin?: string | null
          packaging_status?: string | null
          product_sheet_url?: string | null
          rejection_reason?: string | null
          selling_price?: number | null
          shelf_life?: string | null
          sku?: string | null
          status?: string
          supplier_id?: string
          tech_integration_status?: string | null
          transmitted_at?: string | null
          transmitted_by?: string | null
          unit_price?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          weight?: string | null
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
      replenishment_suggestions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auto_executable: boolean | null
          catalog_id: string
          confidence_score: number | null
          created_at: string
          executed_at: string | null
          id: string
          notes: string | null
          priority: string | null
          reason: string
          source: string | null
          source_partner_id: string | null
          status: string
          suggested_quantity: number
          target_partner_id: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auto_executable?: boolean | null
          catalog_id: string
          confidence_score?: number | null
          created_at?: string
          executed_at?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          reason: string
          source?: string | null
          source_partner_id?: string | null
          status?: string
          suggested_quantity: number
          target_partner_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auto_executable?: boolean | null
          catalog_id?: string
          confidence_score?: number | null
          created_at?: string
          executed_at?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          reason?: string
          source?: string | null
          source_partner_id?: string | null
          status?: string
          suggested_quantity?: number
          target_partner_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "replenishment_suggestions_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replenishment_suggestions_source_partner_id_fkey"
            columns: ["source_partner_id"]
            isOneToOne: false
            referencedRelation: "logistics_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replenishment_suggestions_target_partner_id_fkey"
            columns: ["target_partner_id"]
            isOneToOne: false
            referencedRelation: "logistics_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      salaries: {
        Row: {
          bonuses: number | null
          created_at: string | null
          deductions: number | null
          employee_id: string | null
          gross_amount: number
          id: string
          net_amount: number
          paid_date: string | null
          period_month: number
          period_year: number
          status: string | null
          updated_at: string | null
          validated_by: string | null
        }
        Insert: {
          bonuses?: number | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string | null
          gross_amount: number
          id?: string
          net_amount: number
          paid_date?: string | null
          period_month: number
          period_year: number
          status?: string | null
          updated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          bonuses?: number | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string | null
          gross_amount?: number
          id?: string
          net_amount?: number
          paid_date?: string | null
          period_month?: number
          period_year?: number
          status?: string | null
          updated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salaries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          affected_user_id: string | null
          alert_type: string
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_user_id?: string | null
          alert_type: string
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_user_id?: string | null
          alert_type?: string
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          catalog_id: string
          created_at: string
          id: string
          movement_type: string
          performed_by: string | null
          quantity: number
          reason: string | null
          reference: string | null
          source_partner_id: string | null
          target_partner_id: string | null
        }
        Insert: {
          catalog_id: string
          created_at?: string
          id?: string
          movement_type: string
          performed_by?: string | null
          quantity: number
          reason?: string | null
          reference?: string | null
          source_partner_id?: string | null
          target_partner_id?: string | null
        }
        Update: {
          catalog_id?: string
          created_at?: string
          id?: string
          movement_type?: string
          performed_by?: string | null
          quantity?: number
          reason?: string | null
          reference?: string | null
          source_partner_id?: string | null
          target_partner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_source_partner_id_fkey"
            columns: ["source_partner_id"]
            isOneToOne: false
            referencedRelation: "logistics_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_target_partner_id_fkey"
            columns: ["target_partner_id"]
            isOneToOne: false
            referencedRelation: "logistics_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_audits: {
        Row: {
          auditor: string
          category: string
          created_at: string | null
          date: string
          findings: number | null
          id: string
          notes: string | null
          score: number | null
          status: string
          supplier: string
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          auditor?: string
          category?: string
          created_at?: string | null
          date?: string
          findings?: number | null
          id?: string
          notes?: string | null
          score?: number | null
          status?: string
          supplier: string
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auditor?: string
          category?: string
          created_at?: string | null
          date?: string
          findings?: number | null
          id?: string
          notes?: string | null
          score?: number | null
          status?: string
          supplier?: string
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_audits_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_lead_times: {
        Row: {
          catalog_id: string
          created_at: string
          currency: string | null
          id: string
          is_primary: boolean | null
          lead_time_days: number
          moq: number
          notes: string | null
          reliability_score: number | null
          supplier_contact: string | null
          supplier_name: string
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          catalog_id: string
          created_at?: string
          currency?: string | null
          id?: string
          is_primary?: boolean | null
          lead_time_days?: number
          moq?: number
          notes?: string | null
          reliability_score?: number | null
          supplier_contact?: string | null
          supplier_name: string
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          catalog_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          is_primary?: boolean | null
          lead_time_days?: number
          moq?: number
          notes?: string | null
          reliability_score?: number | null
          supplier_contact?: string | null
          supplier_name?: string
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_lead_times_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          due_date: string
          id: string
          invoice_number: string
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          status: string | null
          supplier_id: string | null
          updated_at: string | null
          validated_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          due_date: string
          id?: string
          invoice_number: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_portfolios: {
        Row: {
          backup_id: string | null
          backup_name: string
          category: string
          created_at: string | null
          id: string
          responsible_id: string | null
          responsible_name: string
          updated_at: string | null
        }
        Insert: {
          backup_id?: string | null
          backup_name?: string
          category: string
          created_at?: string | null
          id?: string
          responsible_id?: string | null
          responsible_name?: string
          updated_at?: string | null
        }
        Update: {
          backup_id?: string | null
          backup_name?: string
          category?: string
          created_at?: string | null
          id?: string
          responsible_id?: string | null
          responsible_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          audit_status: string | null
          contact_email: string | null
          contact_name: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          last_audit_date: string | null
          name: string
          notes: string | null
          phone: string | null
          quality_score: number | null
          risk_score: number | null
          status: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          address?: string | null
          audit_status?: string | null
          contact_email?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_audit_date?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          quality_score?: number | null
          risk_score?: number | null
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          address?: string | null
          audit_status?: string | null
          contact_email?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_audit_date?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          quality_score?: number | null
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
      vpn_access: {
        Row: {
          created_at: string
          device_name: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          ip_address: string | null
          last_seen_at: string | null
          metadata: Json | null
          notes: string | null
          provider: string | null
          provider_device_id: string | null
          revoked_at: string | null
          status: string
          updated_at: string
          user_email: string | null
          user_id: string | null
          user_name: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string | null
          metadata?: Json | null
          notes?: string | null
          provider?: string | null
          provider_device_id?: string | null
          revoked_at?: string | null
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string | null
          metadata?: Json | null
          notes?: string | null
          provider?: string | null
          provider_device_id?: string | null
          revoked_at?: string | null
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string
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
      calculate_demand_forecast: { Args: never; Returns: number }
      detect_replenishment_needs: { Args: never; Returns: number }
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
        | "marketing_manager"
        | "rh_manager"
        | "risk_manager"
        | "rd_manager"
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
        "marketing_manager",
        "rh_manager",
        "risk_manager",
        "rd_manager",
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
