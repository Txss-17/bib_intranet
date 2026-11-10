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
      access_actions: {
        Row: {
          action_key: string
          created_at: string
          description: string | null
          id: string
          label: string
        }
        Insert: {
          action_key: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
        }
        Update: {
          action_key?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
        }
        Relationships: []
      }
      access_assignments: {
        Row: {
          created_at: string
          employee_id: string
          ends_at: string | null
          id: string
          role_id: string | null
          scope_id: string | null
          scope_value: string | null
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          ends_at?: string | null
          id?: string
          role_id?: string | null
          scope_id?: string | null
          scope_value?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          ends_at?: string | null
          id?: string
          role_id?: string | null
          scope_id?: string | null
          scope_value?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "access_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_assignments_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "access_scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      access_business_portfolios: {
        Row: {
          created_at: string
          id: string
          label_snapshot: string | null
          portfolio_type_id: string
          source_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label_snapshot?: string | null
          portfolio_type_id: string
          source_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label_snapshot?: string | null
          portfolio_type_id?: string
          source_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_business_portfolios_portfolio_type_id_fkey"
            columns: ["portfolio_type_id"]
            isOneToOne: false
            referencedRelation: "access_portfolio_types"
            referencedColumns: ["id"]
          },
        ]
      }
      access_change_history: {
        Row: {
          actor_id: string | null
          assignment_id: string | null
          change_type: string
          created_at: string
          employee_id: string | null
          id: string
          new_value: Json | null
          previous_value: Json | null
          reason: string | null
          role_id: string | null
        }
        Insert: {
          actor_id?: string | null
          assignment_id?: string | null
          change_type: string
          created_at?: string
          employee_id?: string | null
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          role_id?: string | null
        }
        Update: {
          actor_id?: string | null
          assignment_id?: string | null
          change_type?: string
          created_at?: string
          employee_id?: string | null
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          role_id?: string | null
        }
        Relationships: []
      }
      access_interfaces: {
        Row: {
          created_at: string
          id: string
          interface_key: string
          label: string
          module: string | null
          path: string | null
          pole: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          interface_key: string
          label: string
          module?: string | null
          path?: string | null
          pole?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          interface_key?: string
          label?: string
          module?: string | null
          path?: string | null
          pole?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      access_permissions: {
        Row: {
          action_id: string
          allowed: boolean
          id: string
          interface_id: string
          role_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_id: string
          allowed?: boolean
          id?: string
          interface_id: string
          role_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_id?: string
          allowed?: boolean
          id?: string
          interface_id?: string
          role_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_permissions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "access_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_permissions_interface_id_fkey"
            columns: ["interface_id"]
            isOneToOne: false
            referencedRelation: "access_interfaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "access_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      access_portfolio_assignments: {
        Row: {
          access_assignment_id: string | null
          assigned_by: string | null
          assignment_status: string
          created_at: string
          employee_id: string
          ends_at: string | null
          id: string
          portfolio_id: string
          reason: string | null
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          access_assignment_id?: string | null
          assigned_by?: string | null
          assignment_status?: string
          created_at?: string
          employee_id: string
          ends_at?: string | null
          id?: string
          portfolio_id: string
          reason?: string | null
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          access_assignment_id?: string | null
          assigned_by?: string | null
          assignment_status?: string
          created_at?: string
          employee_id?: string
          ends_at?: string | null
          id?: string
          portfolio_id?: string
          reason?: string | null
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_portfolio_assignments_access_assignment_id_fkey"
            columns: ["access_assignment_id"]
            isOneToOne: false
            referencedRelation: "access_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_portfolio_assignments_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "access_business_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      access_portfolio_types: {
        Row: {
          business_pole: string | null
          created_at: string
          id: string
          label: string
          portfolio_type_key: string
          source_table: string | null
          status: string
        }
        Insert: {
          business_pole?: string | null
          created_at?: string
          id?: string
          label: string
          portfolio_type_key: string
          source_table?: string | null
          status?: string
        }
        Update: {
          business_pole?: string | null
          created_at?: string
          id?: string
          label?: string
          portfolio_type_key?: string
          source_table?: string | null
          status?: string
        }
        Relationships: []
      }
      access_role_scope_policy_drafts: {
        Row: {
          policy: Json
          role_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          policy: Json
          role_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          policy?: Json
          role_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_role_scope_policy_drafts_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: true
            referencedRelation: "access_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      access_role_scopes: {
        Row: {
          created_at: string
          id: string
          role_id: string
          scope_id: string
          scope_value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          scope_id: string
          scope_value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          scope_id?: string
          scope_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_role_scopes_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "access_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_role_scopes_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "access_scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      access_roles: {
        Row: {
          business_pole: string | null
          created_at: string
          department: string | null
          description: string | null
          id: string
          is_external: boolean
          label: string
          landing_path: string | null
          owner_type: string | null
          poles: string[]
          read_only: boolean
          role_key: string
          seniority: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_pole?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          is_external?: boolean
          label: string
          landing_path?: string | null
          owner_type?: string | null
          poles?: string[]
          read_only?: boolean
          role_key: string
          seniority?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_pole?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          is_external?: boolean
          label?: string
          landing_path?: string | null
          owner_type?: string | null
          poles?: string[]
          read_only?: boolean
          role_key?: string
          seniority?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      access_scope_portfolios: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          pole: string
          portfolio_id: string
          status: string
          subsidiary: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          pole: string
          portfolio_id: string
          status?: string
          subsidiary: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          pole?: string
          portfolio_id?: string
          status?: string
          subsidiary?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_scope_portfolios_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "access_business_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      access_scope_regions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          label: string
          pole: string
          region_code: string
          status: string
          subsidiary: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          pole: string
          region_code: string
          status?: string
          subsidiary: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          pole?: string
          region_code?: string
          status?: string
          subsidiary?: string
        }
        Relationships: []
      }
      access_scopes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          label: string
          scope_key: string
          scope_type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          label: string
          scope_key: string
          scope_type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          scope_key?: string
          scope_type?: string | null
        }
        Relationships: []
      }
      admin_permissions: {
        Row: {
          action: string
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          resource: string
          updated_at: string
        }
        Insert: {
          action: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          resource: string
          updated_at?: string
        }
        Update: {
          action?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          resource?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "admin_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_user_permissions: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          permission_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "admin_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_user_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      anomalies: {
        Row: {
          ai_decision: string | null
          ai_suggestion: Json | null
          ai_validated_at: string | null
          ai_validated_by: string | null
          archived_at: string | null
          category: string | null
          change_note: string | null
          checks: Json
          closed_at: string | null
          closed_by: string | null
          closure_kind: string | null
          completed_checks: string[]
          corrective_action: string | null
          created_at: string
          created_by: string | null
          creation_key: string | null
          creation_request: Json | null
          description: string | null
          document_ids: string[]
          due_at: string | null
          evidence: string | null
          id: string
          last_reminded_at: string | null
          legacy_record: boolean
          object_id: string | null
          object_type: string | null
          owner_id: string | null
          reference: string
          reminder_at: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          revision: number
          severity: string
          source: string
          status: string
          team: string
          test_account: boolean
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          ai_decision?: string | null
          ai_suggestion?: Json | null
          ai_validated_at?: string | null
          ai_validated_by?: string | null
          archived_at?: string | null
          category?: string | null
          change_note?: string | null
          checks?: Json
          closed_at?: string | null
          closed_by?: string | null
          closure_kind?: string | null
          completed_checks?: string[]
          corrective_action?: string | null
          created_at?: string
          created_by?: string | null
          creation_key?: string | null
          creation_request?: Json | null
          description?: string | null
          document_ids?: string[]
          due_at?: string | null
          evidence?: string | null
          id?: string
          last_reminded_at?: string | null
          legacy_record?: boolean
          object_id?: string | null
          object_type?: string | null
          owner_id?: string | null
          reference?: string
          reminder_at?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          revision?: number
          severity?: string
          source: string
          status?: string
          team?: string
          test_account?: boolean
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          ai_decision?: string | null
          ai_suggestion?: Json | null
          ai_validated_at?: string | null
          ai_validated_by?: string | null
          archived_at?: string | null
          category?: string | null
          change_note?: string | null
          checks?: Json
          closed_at?: string | null
          closed_by?: string | null
          closure_kind?: string | null
          completed_checks?: string[]
          corrective_action?: string | null
          created_at?: string
          created_by?: string | null
          creation_key?: string | null
          creation_request?: Json | null
          description?: string | null
          document_ids?: string[]
          due_at?: string | null
          evidence?: string | null
          id?: string
          last_reminded_at?: string | null
          legacy_record?: boolean
          object_id?: string | null
          object_type?: string | null
          owner_id?: string | null
          reference?: string
          reminder_at?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          revision?: number
          severity?: string
          source?: string
          status?: string
          team?: string
          test_account?: boolean
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anomalies_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anomalies_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      anomaly_events: {
        Row: {
          after_state: Json | null
          anomaly_id: string
          before_state: Json | null
          created_at: string
          from_status: string | null
          id: string
          kind: string
          message: string | null
          performed_by: string | null
          to_status: string | null
        }
        Insert: {
          after_state?: Json | null
          anomaly_id: string
          before_state?: Json | null
          created_at?: string
          from_status?: string | null
          id?: string
          kind?: string
          message?: string | null
          performed_by?: string | null
          to_status?: string | null
        }
        Update: {
          after_state?: Json | null
          anomaly_id?: string
          before_state?: Json | null
          created_at?: string
          from_status?: string | null
          id?: string
          kind?: string
          message?: string | null
          performed_by?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_events_anomaly_id_fkey"
            columns: ["anomaly_id"]
            isOneToOne: false
            referencedRelation: "anomalies"
            referencedColumns: ["id"]
          },
        ]
      }
      anomaly_notifications: {
        Row: {
          anomaly_id: string
          id: string
          kind: string
          message: string | null
          recipient_id: string | null
          sent_at: string
        }
        Insert: {
          anomaly_id: string
          id?: string
          kind: string
          message?: string | null
          recipient_id?: string | null
          sent_at?: string
        }
        Update: {
          anomaly_id?: string
          id?: string
          kind?: string
          message?: string | null
          recipient_id?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_notifications_anomaly_id_fkey"
            columns: ["anomaly_id"]
            isOneToOne: false
            referencedRelation: "anomalies"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_history: {
        Row: {
          action: string
          actor_id: string | null
          comment: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          comment?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          comment?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      audit_incidents: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          declared_at: string
          declared_by: string | null
          declared_by_name: string | null
          description: string | null
          id: string
          pole_id: Database["public"]["Enums"]["pole_id"] | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          declared_at?: string
          declared_by?: string | null
          declared_by_name?: string | null
          description?: string | null
          id?: string
          pole_id?: Database["public"]["Enums"]["pole_id"] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          declared_at?: string
          declared_by?: string | null
          declared_by_name?: string | null
          description?: string | null
          id?: string
          pole_id?: Database["public"]["Enums"]["pole_id"] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      audit_mission_events: {
        Row: {
          audit_id: string
          created_at: string
          from_status: string | null
          id: string
          message: string | null
          origin: string
          performed_by: string | null
          to_status: string | null
        }
        Insert: {
          audit_id: string
          created_at?: string
          from_status?: string | null
          id?: string
          message?: string | null
          origin?: string
          performed_by?: string | null
          to_status?: string | null
        }
        Update: {
          audit_id?: string
          created_at?: string
          from_status?: string | null
          id?: string
          message?: string | null
          origin?: string
          performed_by?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_mission_events_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "field_audits"
            referencedColumns: ["id"]
          },
        ]
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
      bi_dashboard_versions: {
        Row: {
          author_id: string | null
          created_at: string
          dashboard_id: string
          id: string
          kpis_added: string[] | null
          kpis_removed: string[] | null
          note: string | null
          snapshot: Json
          version: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          dashboard_id: string
          id?: string
          kpis_added?: string[] | null
          kpis_removed?: string[] | null
          note?: string | null
          snapshot: Json
          version: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          dashboard_id?: string
          id?: string
          kpis_added?: string[] | null
          kpis_removed?: string[] | null
          note?: string | null
          snapshot?: Json
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "bi_dashboard_versions_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "bi_dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      bi_dashboard_widgets: {
        Row: {
          config: Json
          created_at: string
          dashboard_id: string
          data_source: string | null
          h: number
          id: string
          kpi_id: string | null
          page_id: string
          title: string | null
          type: string
          updated_at: string
          w: number
          x: number
          y: number
        }
        Insert: {
          config?: Json
          created_at?: string
          dashboard_id: string
          data_source?: string | null
          h?: number
          id?: string
          kpi_id?: string | null
          page_id?: string
          title?: string | null
          type: string
          updated_at?: string
          w?: number
          x?: number
          y?: number
        }
        Update: {
          config?: Json
          created_at?: string
          dashboard_id?: string
          data_source?: string | null
          h?: number
          id?: string
          kpi_id?: string | null
          page_id?: string
          title?: string | null
          type?: string
          updated_at?: string
          w?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "bi_dashboard_widgets_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "bi_dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      bi_dashboards: {
        Row: {
          archive_at: string | null
          created_at: string
          description: string | null
          id: string
          layout: Json
          name: string
          owner_id: string | null
          pages: Json
          pole_id: string | null
          publish_at: string | null
          published_at: string | null
          status: string
          target_filiale: string | null
          target_pole: string | null
          target_role: string | null
          target_users: string[] | null
          template_id: string | null
          updated_at: string
          version: string
        }
        Insert: {
          archive_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          layout?: Json
          name: string
          owner_id?: string | null
          pages?: Json
          pole_id?: string | null
          publish_at?: string | null
          published_at?: string | null
          status?: string
          target_filiale?: string | null
          target_pole?: string | null
          target_role?: string | null
          target_users?: string[] | null
          template_id?: string | null
          updated_at?: string
          version?: string
        }
        Update: {
          archive_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          layout?: Json
          name?: string
          owner_id?: string | null
          pages?: Json
          pole_id?: string | null
          publish_at?: string | null
          published_at?: string | null
          status?: string
          target_filiale?: string | null
          target_pole?: string | null
          target_role?: string | null
          target_users?: string[] | null
          template_id?: string | null
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      bi_data_sources: {
        Row: {
          business_pole: string | null
          business_subsidiary: string | null
          config: Json
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          business_pole?: string | null
          business_subsidiary?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          business_pole?: string | null
          business_subsidiary?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      bi_templates: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          pole_id: string | null
          preset: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          pole_id?: string | null
          preset?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          pole_id?: string | null
          preset?: Json
          updated_at?: string
        }
        Relationships: []
      }
      bib_case_portfolio_members: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          ended_at: string | null
          entity_id: string
          entity_kind: string
          id: string
          portfolio_id: string
          reason: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          ended_at?: string | null
          entity_id: string
          entity_kind: string
          id?: string
          portfolio_id: string
          reason?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          ended_at?: string | null
          entity_id?: string
          entity_kind?: string
          id?: string
          portfolio_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bib_case_portfolio_members_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "bib_case_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      bib_case_portfolio_owner_events: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          new_owner_id: string | null
          portfolio_id: string
          previous_owner_id: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          new_owner_id?: string | null
          portfolio_id: string
          previous_owner_id?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          new_owner_id?: string | null
          portfolio_id?: string
          previous_owner_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bib_case_portfolio_owner_events_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "bib_case_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      bib_case_portfolios: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          owner_id: string | null
          pole: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          owner_id?: string | null
          pole: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          pole?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bib_case_portfolios_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bib_fiscal_events: {
        Row: {
          action: string
          actor_id: string
          after_body: Json
          before_body: Json | null
          created_at: string
          id: string
          record_id: string
          test_account: boolean
        }
        Insert: {
          action: string
          actor_id: string
          after_body: Json
          before_body?: Json | null
          created_at?: string
          id?: string
          record_id: string
          test_account: boolean
        }
        Update: {
          action?: string
          actor_id?: string
          after_body?: Json
          before_body?: Json | null
          created_at?: string
          id?: string
          record_id?: string
          test_account?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bib_fiscal_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bib_fiscal_records: {
        Row: {
          body: Json
          created_by: string
          record_id: string
          revision: number
          test_account: boolean
          updated_at: string
          updated_by: string
        }
        Insert: {
          body: Json
          created_by: string
          record_id: string
          revision?: number
          test_account: boolean
          updated_at?: string
          updated_by: string
        }
        Update: {
          body?: Json
          created_by?: string
          record_id?: string
          revision?: number
          test_account?: boolean
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "bib_fiscal_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bib_fiscal_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bib_fiscal_reference_catalog: {
        Row: {
          body: Json
          record_id: string
          reference_version: string
        }
        Insert: {
          body: Json
          record_id: string
          reference_version?: string
        }
        Update: {
          body?: Json
          record_id?: string
          reference_version?: string
        }
        Relationships: []
      }
      bib_partner_catalog_eligibility: {
        Row: {
          audit_reuse_reference: string | null
          case_id: string
          certification_evidence: Json
          created_at: string
          documentary_evidence: Json
          id: string
          product_description: string
          reviewed_at: string | null
          reviewed_by: string | null
          sku: string
          status: string
          test_account: boolean
          updated_at: string
        }
        Insert: {
          audit_reuse_reference?: string | null
          case_id: string
          certification_evidence?: Json
          created_at?: string
          documentary_evidence?: Json
          id?: string
          product_description: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sku: string
          status?: string
          test_account?: boolean
          updated_at?: string
        }
        Update: {
          audit_reuse_reference?: string | null
          case_id?: string
          certification_evidence?: Json
          created_at?: string
          documentary_evidence?: Json
          id?: string
          product_description?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sku?: string
          status?: string
          test_account?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bib_partner_catalog_eligibility_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "bib_partner_onboarding_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      bib_partner_onboarding_cases: {
        Row: {
          created_at: string
          created_by: string
          id: string
          partner_kind: string
          platform_submission_id: string | null
          source_id: string
          stage: string
          test_account: boolean
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          partner_kind: string
          platform_submission_id?: string | null
          source_id: string
          stage?: string
          test_account?: boolean
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          partner_kind?: string
          platform_submission_id?: string | null
          source_id?: string
          stage?: string
          test_account?: boolean
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      bib_partner_onboarding_events: {
        Row: {
          actor_id: string
          case_id: string
          created_at: string
          evidence_reference: string
          id: string
          next_stage: string
          notes: string | null
          previous_stage: string | null
        }
        Insert: {
          actor_id: string
          case_id: string
          created_at?: string
          evidence_reference: string
          id?: string
          next_stage: string
          notes?: string | null
          previous_stage?: string | null
        }
        Update: {
          actor_id?: string
          case_id?: string
          created_at?: string
          evidence_reference?: string
          id?: string
          next_stage?: string
          notes?: string | null
          previous_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bib_partner_onboarding_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "bib_partner_onboarding_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      bib_pilot_partner_events: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          next_state: string
          previous_state: string | null
          reference: string | null
          selection_id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          next_state: string
          previous_state?: string | null
          reference?: string | null
          selection_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          next_state?: string
          previous_state?: string | null
          reference?: string | null
          selection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bib_pilot_partner_events_selection_id_fkey"
            columns: ["selection_id"]
            isOneToOne: false
            referencedRelation: "bib_pilot_partner_selections"
            referencedColumns: ["id"]
          },
        ]
      }
      bib_pilot_partner_selections: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          evidence_reference: string | null
          id: string
          nominated_by: string
          partner_id: string
          partner_kind: string
          platform_submission_id: string | null
          state: string
          test_account: boolean
          updated_at: string
          updated_by: string
          wave: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          evidence_reference?: string | null
          id?: string
          nominated_by: string
          partner_id: string
          partner_kind: string
          platform_submission_id?: string | null
          state?: string
          test_account?: boolean
          updated_at?: string
          updated_by: string
          wave: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          evidence_reference?: string | null
          id?: string
          nominated_by?: string
          partner_id?: string
          partner_kind?: string
          platform_submission_id?: string | null
          state?: string
          test_account?: boolean
          updated_at?: string
          updated_by?: string
          wave?: number
        }
        Relationships: []
      }
      bib_sourcing_candidates: {
        Row: {
          candidate_status: string
          comparison_notes: string | null
          contact_reference: string | null
          converted_application_id: string | null
          coverage: string | null
          created_at: string
          created_by: string
          currency: string | null
          evidence_reference: string | null
          followup_due_at: string | null
          id: string
          lead_time_days: number | null
          mission_id: string
          moq: number | null
          offer_summary: string
          organization_name: string
          partner_reference: string | null
          price_amount: number | null
          sla_percent: number | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          candidate_status?: string
          comparison_notes?: string | null
          contact_reference?: string | null
          converted_application_id?: string | null
          coverage?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          evidence_reference?: string | null
          followup_due_at?: string | null
          id?: string
          lead_time_days?: number | null
          mission_id: string
          moq?: number | null
          offer_summary: string
          organization_name: string
          partner_reference?: string | null
          price_amount?: number | null
          sla_percent?: number | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          candidate_status?: string
          comparison_notes?: string | null
          contact_reference?: string | null
          converted_application_id?: string | null
          coverage?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          evidence_reference?: string | null
          followup_due_at?: string | null
          id?: string
          lead_time_days?: number | null
          mission_id?: string
          moq?: number | null
          offer_summary?: string
          organization_name?: string
          partner_reference?: string | null
          price_amount?: number | null
          sla_percent?: number | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "bib_sourcing_candidates_converted_application_id_fkey"
            columns: ["converted_application_id"]
            isOneToOne: false
            referencedRelation: "supplier_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bib_sourcing_candidates_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "bib_sourcing_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      bib_sourcing_followups: {
        Row: {
          candidate_id: string
          created_at: string
          due_at: string
          id: string
          note: string
          outcome: string
          recorded_by: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          due_at: string
          id?: string
          note: string
          outcome: string
          recorded_by: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          due_at?: string
          id?: string
          note?: string
          outcome?: string
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "bib_sourcing_followups_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "bib_sourcing_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      bib_sourcing_missions: {
        Row: {
          created_at: string
          created_by: string
          due_date: string | null
          evidence_reference: string | null
          id: string
          merchant_id: string | null
          merchant_reference: string | null
          owner_id: string
          pole: string
          priority: string
          purpose: string
          requirements: string
          status: string
          test_account: boolean
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          due_date?: string | null
          evidence_reference?: string | null
          id?: string
          merchant_id?: string | null
          merchant_reference?: string | null
          owner_id: string
          pole: string
          priority?: string
          purpose: string
          requirements: string
          status?: string
          test_account?: boolean
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          due_date?: string | null
          evidence_reference?: string | null
          id?: string
          merchant_id?: string | null
          merchant_reference?: string | null
          owner_id?: string
          pole?: string
          priority?: string
          purpose?: string
          requirements?: string
          status?: string
          test_account?: boolean
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "bib_sourcing_missions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bib_sourcing_notification_receipts: {
        Row: {
          created_at: string
          followup_id: string
          notification_id: string
          recipient_id: string
        }
        Insert: {
          created_at?: string
          followup_id: string
          notification_id: string
          recipient_id: string
        }
        Update: {
          created_at?: string
          followup_id?: string
          notification_id?: string
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bib_sourcing_notification_receipts_followup_id_fkey"
            columns: ["followup_id"]
            isOneToOne: true
            referencedRelation: "bib_sourcing_followups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bib_sourcing_notification_receipts_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: true
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
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
      business_trips: {
        Row: {
          accommodation: string | null
          actual_cost: number | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          destination: string
          end_date: string
          estimated_budget: number | null
          id: string
          manager_id: string | null
          mission_report: string | null
          notes: string | null
          purpose: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          start_date: string
          status: string
          submitted_at: string | null
          transport_mode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accommodation?: string | null
          actual_cost?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          destination: string
          end_date: string
          estimated_budget?: number | null
          id?: string
          manager_id?: string | null
          mission_report?: string | null
          notes?: string | null
          purpose: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string
          submitted_at?: string | null
          transport_mode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accommodation?: string | null
          actual_cost?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          destination?: string
          end_date?: string
          estimated_budget?: number | null
          id?: string
          manager_id?: string | null
          mission_report?: string | null
          notes?: string | null
          purpose?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          submitted_at?: string | null
          transport_mode?: string | null
          updated_at?: string
          user_id?: string
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
          platform_id: string | null
          platform_synced_at: string | null
          recorded_by: string | null
          reference: string | null
          shop_id: string | null
          source: string
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
          platform_id?: string | null
          platform_synced_at?: string | null
          recorded_by?: string | null
          reference?: string | null
          shop_id?: string | null
          source?: string
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
          platform_id?: string | null
          platform_synced_at?: string | null
          recorded_by?: string | null
          reference?: string | null
          shop_id?: string | null
          source?: string
          transaction_date?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflows_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_acquisition_prices: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          evidence_reference: string
          id: string
          price: Json
          product_id: string
          state: string
          supplier_id: string
          test_account: boolean
          total_cents: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          evidence_reference: string
          id?: string
          price: Json
          product_id: string
          state?: string
          supplier_id: string
          test_account?: boolean
          total_cents: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          evidence_reference?: string
          id?: string
          price?: Json
          product_id?: string
          state?: string
          supplier_id?: string
          test_account?: boolean
          total_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "catalog_acquisition_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_acquisition_prices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
      contracts: {
        Row: {
          contract_number: string
          created_at: string
          created_by: string | null
          document_url: string | null
          end_date: string | null
          id: string
          notes: string | null
          party: string | null
          shop_id: string | null
          signed_at: string | null
          start_date: string | null
          status: string
          supplier_id: string | null
          title: string
          type: string
          updated_at: string
          value: string | null
        }
        Insert: {
          contract_number: string
          created_at?: string
          created_by?: string | null
          document_url?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          party?: string | null
          shop_id?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string
          supplier_id?: string | null
          title: string
          type?: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          contract_number?: string
          created_at?: string
          created_by?: string | null
          document_url?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          party?: string | null
          shop_id?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string
          supplier_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_card_transactions: {
        Row: {
          amount: number
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          card_id: string
          category: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          merchant: string
          receipt_url: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: string
          submitted_at: string | null
          transaction_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          card_id: string
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          merchant: string
          receipt_url?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          transaction_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          card_id?: string
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          merchant?: string
          receipt_url?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          transaction_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_card_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "corporate_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_cards: {
        Row: {
          activated_at: string | null
          allowed_categories: string[]
          card_number_masked: string
          card_type: string
          created_at: string
          id: string
          monthly_limit: number
          status: string
          suspended_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          allowed_categories?: string[]
          card_number_masked: string
          card_type?: string
          created_at?: string
          id?: string
          monthly_limit?: number
          status?: string
          suspended_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          allowed_categories?: string[]
          card_number_masked?: string
          card_type?: string
          created_at?: string
          id?: string
          monthly_limit?: number
          status?: string
          suspended_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      direction_board_reports: {
        Row: {
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          period: string | null
          published_at: string | null
          status: string
          summary: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          period?: string | null
          published_at?: string | null
          status?: string
          summary?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          period?: string | null
          published_at?: string | null
          status?: string
          summary?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      direction_decision_history: {
        Row: {
          actor_id: string | null
          created_at: string
          decision_id: string
          event_type: string
          id: string
          new_status: string | null
          notes: string | null
          old_status: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          decision_id: string
          event_type: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          decision_id?: string
          event_type?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direction_decision_history_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "direction_decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      direction_decisions: {
        Row: {
          category: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          defer_until: string | null
          description: string
          id: string
          impact: string | null
          priority: string
          recommendation: string | null
          status: string
          submitted_by: string
          submitted_by_name: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          defer_until?: string | null
          description: string
          id?: string
          impact?: string | null
          priority?: string
          recommendation?: string | null
          status?: string
          submitted_by?: string
          submitted_by_name?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          defer_until?: string | null
          description?: string
          id?: string
          impact?: string | null
          priority?: string
          recommendation?: string | null
          status?: string
          submitted_by?: string
          submitted_by_name?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      direction_roadmap_history: {
        Row: {
          action: string
          created_at: string
          id: string
          item_id: string | null
          item_title: string | null
          new_value: Json | null
          old_value: Json | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          item_id?: string | null
          item_title?: string | null
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          item_id?: string | null
          item_title?: string | null
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string | null
        }
        Relationships: []
      }
      direction_roadmap_items: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          kind: string
          objectives: Json
          phase: string | null
          progress: number
          sort_order: number
          start_date: string | null
          status: string
          title: string
          updated_at: string
          updated_by: string | null
          weight: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          kind?: string
          objectives?: Json
          phase?: string | null
          progress?: number
          sort_order?: number
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          weight?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          kind?: string
          objectives?: Json
          phase?: string | null
          progress?: number
          sort_order?: number
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          weight?: number
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
          anomaly_id: string | null
          app_origin: string
          assigned_at: string | null
          audit_type: string
          auditor_id: string | null
          change_note: string | null
          closed_at: string | null
          closed_by: string | null
          completed_date: string | null
          correction_evidence: string | null
          corrective_action: string | null
          corrective_due_date: string | null
          created_at: string | null
          created_by: string | null
          creation_key: string | null
          creation_request: Json | null
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          field_started_at: string | null
          findings: string | null
          id: string
          mission_reference: string | null
          recommendations: string | null
          revision: number
          scheduled_date: string | null
          score: number | null
          status: string | null
          synced_at: string | null
          target_id: string | null
          target_name: string | null
          target_type: string
          test_account: boolean
          updated_at: string | null
          workflow_status: string
        }
        Insert: {
          anomaly_id?: string | null
          app_origin?: string
          assigned_at?: string | null
          audit_type: string
          auditor_id?: string | null
          change_note?: string | null
          closed_at?: string | null
          closed_by?: string | null
          completed_date?: string | null
          correction_evidence?: string | null
          corrective_action?: string | null
          corrective_due_date?: string | null
          created_at?: string | null
          created_by?: string | null
          creation_key?: string | null
          creation_request?: Json | null
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          field_started_at?: string | null
          findings?: string | null
          id?: string
          mission_reference?: string | null
          recommendations?: string | null
          revision?: number
          scheduled_date?: string | null
          score?: number | null
          status?: string | null
          synced_at?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type: string
          test_account?: boolean
          updated_at?: string | null
          workflow_status?: string
        }
        Update: {
          anomaly_id?: string | null
          app_origin?: string
          assigned_at?: string | null
          audit_type?: string
          auditor_id?: string | null
          change_note?: string | null
          closed_at?: string | null
          closed_by?: string | null
          completed_date?: string | null
          correction_evidence?: string | null
          corrective_action?: string | null
          corrective_due_date?: string | null
          created_at?: string | null
          created_by?: string | null
          creation_key?: string | null
          creation_request?: Json | null
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          field_started_at?: string | null
          findings?: string | null
          id?: string
          mission_reference?: string | null
          recommendations?: string | null
          revision?: number
          scheduled_date?: string | null
          score?: number | null
          status?: string | null
          synced_at?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string
          test_account?: boolean
          updated_at?: string | null
          workflow_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_audits_anomaly_id_fkey"
            columns: ["anomaly_id"]
            isOneToOne: false
            referencedRelation: "anomalies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_audits_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_audits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_audits_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_invoice_register: {
        Row: {
          amount_excl_tax: number
          counterparty: string
          created_at: string
          currency: string
          description: string
          direction: string
          document_reference: string
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          origin: string
          payment_date: string | null
          payment_reference: string | null
          recorded_by: string
          status: string
          tax_amount: number
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          amount_excl_tax: number
          counterparty: string
          created_at?: string
          currency?: string
          description: string
          direction: string
          document_reference: string
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date: string
          origin?: string
          payment_date?: string | null
          payment_reference?: string | null
          recorded_by: string
          status?: string
          tax_amount?: number
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          amount_excl_tax?: number
          counterparty?: string
          created_at?: string
          currency?: string
          description?: string
          direction?: string
          document_reference?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          origin?: string
          payment_date?: string | null
          payment_reference?: string | null
          recorded_by?: string
          status?: string
          tax_amount?: number
          total_amount?: number | null
          updated_at?: string
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
      governance_blocks: {
        Row: {
          created_at: string
          description: string | null
          detail: string | null
          id: string
          kind: string
          name: string
          sort_order: number
          status: string
          subtitle: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          detail?: string | null
          id?: string
          kind: string
          name: string
          sort_order?: number
          status?: string
          subtitle?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          detail?: string | null
          id?: string
          kind?: string
          name?: string
          sort_order?: number
          status?: string
          subtitle?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      governance_documents: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          uploaded_by?: string | null
          version?: string | null
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
      hr_account_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          details: Json
          id: string
          request_id: string | null
          role_key: string | null
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json
          id?: string
          request_id?: string | null
          role_key?: string | null
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json
          id?: string
          request_id?: string | null
          role_key?: string | null
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      hr_attendance_records: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          work_date: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          work_date?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          work_date?: string
        }
        Relationships: []
      }
      hr_candidates: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          need_id: string | null
          next_step: string | null
          owner_id: string | null
          platform_application_id: string | null
          position_key: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          need_id?: string | null
          next_step?: string | null
          owner_id?: string | null
          platform_application_id?: string | null
          position_key?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          need_id?: string | null
          next_step?: string | null
          owner_id?: string | null
          platform_application_id?: string | null
          position_key?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_candidates_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "hr_recruitment_needs"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_request_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          request_id: string
          to_status: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          request_id: string
          to_status?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          request_id?: string
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "hr_employee_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_requests: {
        Row: {
          account_created_at: string | null
          account_created_by: string | null
          attached_documents: Json
          collaborator_type: string
          contract_type: string | null
          created_at: string
          created_by: string | null
          created_user_id: string | null
          first_name: string
          hr_validated_at: string | null
          hr_validated_by: string | null
          id: string
          last_name: string
          manager_id: string | null
          mutation_creation_key: string | null
          mutation_of: string | null
          mutation_replace_assignment_ids: string[]
          mutation_result_assignment_id: string | null
          mutation_snapshot: Json
          notes: string | null
          personal_email: string | null
          poles: string[]
          position: Database["public"]["Enums"]["employee_position"] | null
          position_key: string | null
          primary_pole: string | null
          reference: string
          rejection_reason: string | null
          request_kind: string
          requested_role: string
          seniority: string
          start_date: string | null
          status: string
          subsidiary: string | null
          target_user_id: string | null
          updated_at: string
          work_email: string | null
          work_mode: string | null
        }
        Insert: {
          account_created_at?: string | null
          account_created_by?: string | null
          attached_documents?: Json
          collaborator_type?: string
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          created_user_id?: string | null
          first_name: string
          hr_validated_at?: string | null
          hr_validated_by?: string | null
          id?: string
          last_name: string
          manager_id?: string | null
          mutation_creation_key?: string | null
          mutation_of?: string | null
          mutation_replace_assignment_ids?: string[]
          mutation_result_assignment_id?: string | null
          mutation_snapshot?: Json
          notes?: string | null
          personal_email?: string | null
          poles?: string[]
          position?: Database["public"]["Enums"]["employee_position"] | null
          position_key?: string | null
          primary_pole?: string | null
          reference?: string
          rejection_reason?: string | null
          request_kind?: string
          requested_role: string
          seniority?: string
          start_date?: string | null
          status?: string
          subsidiary?: string | null
          target_user_id?: string | null
          updated_at?: string
          work_email?: string | null
          work_mode?: string | null
        }
        Update: {
          account_created_at?: string | null
          account_created_by?: string | null
          attached_documents?: Json
          collaborator_type?: string
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          created_user_id?: string | null
          first_name?: string
          hr_validated_at?: string | null
          hr_validated_by?: string | null
          id?: string
          last_name?: string
          manager_id?: string | null
          mutation_creation_key?: string | null
          mutation_of?: string | null
          mutation_replace_assignment_ids?: string[]
          mutation_result_assignment_id?: string | null
          mutation_snapshot?: Json
          notes?: string | null
          personal_email?: string | null
          poles?: string[]
          position?: Database["public"]["Enums"]["employee_position"] | null
          position_key?: string | null
          primary_pole?: string | null
          reference?: string
          rejection_reason?: string | null
          request_kind?: string
          requested_role?: string
          seniority?: string
          start_date?: string | null
          status?: string
          subsidiary?: string | null
          target_user_id?: string | null
          updated_at?: string
          work_email?: string | null
          work_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_requests_mutation_of_fkey"
            columns: ["mutation_of"]
            isOneToOne: false
            referencedRelation: "hr_employee_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employee_requests_mutation_result_assignment_id_fkey"
            columns: ["mutation_result_assignment_id"]
            isOneToOne: false
            referencedRelation: "access_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employee_requests_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leave_requests: {
        Row: {
          created_at: string
          created_by: string | null
          decided_at: string | null
          decided_by: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          employee_id?: string
          end_date: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      hr_onboarding_invitation_claims: {
        Row: {
          consumed_at: string | null
          consumed_user_id: string | null
          email: string
          expires_at: string
          issued_at: string
          issued_by: string
          nonce: string
          request_id: string
        }
        Insert: {
          consumed_at?: string | null
          consumed_user_id?: string | null
          email: string
          expires_at: string
          issued_at?: string
          issued_by: string
          nonce: string
          request_id: string
        }
        Update: {
          consumed_at?: string | null
          consumed_user_id?: string | null
          email?: string
          expires_at?: string
          issued_at?: string
          issued_by?: string
          nonce?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_onboarding_invitation_claims_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_onboarding_invitation_claims_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "hr_employee_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_record_events: {
        Row: {
          action: string
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          performed_by: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      hr_recruitment_needs: {
        Row: {
          contract_type: string | null
          created_at: string
          created_by: string | null
          desired_date: string | null
          id: string
          notes: string | null
          pole_id: string | null
          position_key: string
          priority: string
          recruiter_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          desired_date?: string | null
          id?: string
          notes?: string | null
          pole_id?: string | null
          position_key: string
          priority?: string
          recruiter_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          desired_date?: string | null
          id?: string
          notes?: string | null
          pole_id?: string | null
          position_key?: string
          priority?: string
          recruiter_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      hr_talent_applications: {
        Row: {
          assigned_pole: string | null
          availability: string | null
          candidate_id: string | null
          consent_given_at: string
          contribution_type: string | null
          current_activity: string | null
          email: string
          full_name: string
          future_opportunities_consent: boolean
          imported_at: string
          locale: string | null
          location: string | null
          motivation: string | null
          platform_application_id: string
          platform_status: string | null
          platform_updated_at: string
          portfolio_url: string | null
          preferred_pole: string | null
          retention_until: string
          skills: string | null
          submitted_at: string
        }
        Insert: {
          assigned_pole?: string | null
          availability?: string | null
          candidate_id?: string | null
          consent_given_at: string
          contribution_type?: string | null
          current_activity?: string | null
          email: string
          full_name: string
          future_opportunities_consent?: boolean
          imported_at?: string
          locale?: string | null
          location?: string | null
          motivation?: string | null
          platform_application_id: string
          platform_status?: string | null
          platform_updated_at: string
          portfolio_url?: string | null
          preferred_pole?: string | null
          retention_until: string
          skills?: string | null
          submitted_at: string
        }
        Update: {
          assigned_pole?: string | null
          availability?: string | null
          candidate_id?: string | null
          consent_given_at?: string
          contribution_type?: string | null
          current_activity?: string | null
          email?: string
          full_name?: string
          future_opportunities_consent?: boolean
          imported_at?: string
          locale?: string | null
          location?: string | null
          motivation?: string | null
          platform_application_id?: string
          platform_status?: string | null
          platform_updated_at?: string
          portfolio_url?: string | null
          preferred_pole?: string | null
          retention_until?: string
          skills?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_talent_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "hr_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_trainings: {
        Row: {
          created_at: string
          created_by: string | null
          due_date: string | null
          employee_id: string | null
          id: string
          notes: string | null
          provider: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          provider?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          provider?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
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
      intranet_business_history: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          row_id: string | null
          table_name: string
          test_account: boolean
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          row_id?: string | null
          table_name: string
          test_account?: boolean
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          row_id?: string | null
          table_name?: string
          test_account?: boolean
        }
        Relationships: []
      }
      intranet_business_tables: {
        Row: {
          page_ids: string[]
          read_page_ids: string[]
          shared_platform: boolean
          table_name: string
        }
        Insert: {
          page_ids: string[]
          read_page_ids?: string[]
          shared_platform?: boolean
          table_name: string
        }
        Update: {
          page_ids?: string[]
          read_page_ids?: string[]
          shared_platform?: boolean
          table_name?: string
        }
        Relationships: []
      }
      intranet_document_events: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json
          document_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json
          document_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json
          document_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intranet_document_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_document_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "intranet_drive_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      intranet_document_jobs: {
        Row: {
          actor_id: string
          created_at: string
          error_code: string | null
          file_id: string | null
          id: string
          kind: string
          lease_token: string
          lease_until: string
          metadata: Json
          page_id: string
          request_hash: string
          request_key: string
          result: Json | null
          shortcut_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          error_code?: string | null
          file_id?: string | null
          id?: string
          kind: string
          lease_token?: string
          lease_until?: string
          metadata: Json
          page_id: string
          request_hash: string
          request_key: string
          result?: Json | null
          shortcut_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          error_code?: string | null
          file_id?: string | null
          id?: string
          kind?: string
          lease_token?: string
          lease_until?: string
          metadata?: Json
          page_id?: string
          request_hash?: string
          request_key?: string
          result?: Json | null
          shortcut_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intranet_document_jobs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_document_jobs_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "intranet_modules"
            referencedColumns: ["page_id"]
          },
        ]
      }
      intranet_drive_documents: {
        Row: {
          classification: string
          created_at: string
          file_id: string
          id: string
          job_id: string | null
          mime_type: string
          name: string
          owner_id: string
          page_id: string
          size_bytes: number
          test_account: boolean
        }
        Insert: {
          classification: string
          created_at?: string
          file_id: string
          id?: string
          job_id?: string | null
          mime_type: string
          name: string
          owner_id: string
          page_id: string
          size_bytes?: number
          test_account?: boolean
        }
        Update: {
          classification?: string
          created_at?: string
          file_id?: string
          id?: string
          job_id?: string | null
          mime_type?: string
          name?: string
          owner_id?: string
          page_id?: string
          size_bytes?: number
          test_account?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "intranet_drive_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "intranet_document_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_drive_documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_drive_documents_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "intranet_modules"
            referencedColumns: ["page_id"]
          },
        ]
      }
      intranet_email_dispatch: {
        Row: {
          created_at: string
          dispatch_key: string
          message_id: string
          outbox_id: string | null
          payload: Json
          provider_id: string | null
          recipient: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          dispatch_key: string
          message_id: string
          outbox_id?: string | null
          payload: Json
          provider_id?: string | null
          recipient: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          dispatch_key?: string
          message_id?: string
          outbox_id?: string | null
          payload?: Json
          provider_id?: string | null
          recipient?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "intranet_email_dispatch_outbox_id_fkey"
            columns: ["outbox_id"]
            isOneToOne: false
            referencedRelation: "intranet_outbox"
            referencedColumns: ["id"]
          },
        ]
      }
      intranet_ethics_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          kind: string
          note: string | null
          submission_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          submission_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intranet_ethics_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_ethics_events_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "whistleblower_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      intranet_legacy_access_repairs: {
        Row: {
          after_state: Json
          before_state: Json
          profile_id: string
          reason: string
          repaired_at: string
        }
        Insert: {
          after_state: Json
          before_state: Json
          profile_id: string
          reason: string
          repaired_at?: string
        }
        Update: {
          after_state?: Json
          before_state?: Json
          profile_id?: string
          reason?: string
          repaired_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intranet_legacy_access_repairs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intranet_modules: {
        Row: {
          definition: Json
          page_id: string
        }
        Insert: {
          definition: Json
          page_id: string
        }
        Update: {
          definition?: Json
          page_id?: string
        }
        Relationships: []
      }
      intranet_outbox: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body: string
          created_at: string
          created_by: string
          decision_note: string | null
          gmail_references: string | null
          gmail_thread_id: string | null
          id: string
          in_reply_to: string | null
          queued_at: string | null
          recipients: string[]
          request_key: string
          source_message_id: string | null
          status: string
          subject: string
          test_account: boolean
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body: string
          created_at?: string
          created_by: string
          decision_note?: string | null
          gmail_references?: string | null
          gmail_thread_id?: string | null
          id?: string
          in_reply_to?: string | null
          queued_at?: string | null
          recipients: string[]
          request_key: string
          source_message_id?: string | null
          status?: string
          subject: string
          test_account?: boolean
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body?: string
          created_at?: string
          created_by?: string
          decision_note?: string | null
          gmail_references?: string | null
          gmail_thread_id?: string | null
          id?: string
          in_reply_to?: string | null
          queued_at?: string | null
          recipients?: string[]
          request_key?: string
          source_message_id?: string | null
          status?: string
          subject?: string
          test_account?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "intranet_outbox_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_outbox_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_outbox_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "external_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      intranet_outbox_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          kind: string
          note: string | null
          outbox_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          outbox_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          outbox_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intranet_outbox_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_outbox_events_outbox_id_fkey"
            columns: ["outbox_id"]
            isOneToOne: false
            referencedRelation: "intranet_outbox"
            referencedColumns: ["id"]
          },
        ]
      }
      intranet_record_events: {
        Row: {
          actor_id: string
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          kind: string
          note: string | null
          record_id: string
        }
        Insert: {
          actor_id: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          record_id: string
        }
        Update: {
          actor_id?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intranet_record_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_record_events_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "intranet_records"
            referencedColumns: ["id"]
          },
        ]
      }
      intranet_records: {
        Row: {
          approved_by: string | null
          created_at: string
          created_by: string
          creation_key: string
          creation_request: Json
          dispute_approved_at: string | null
          dispute_change_note: string | null
          dispute_legacy: boolean | null
          dispute_opened_at: string | null
          dispute_reference: string | null
          dispute_required_reviews: number | null
          dispute_reviewed_at: string | null
          dispute_submitted_at: string | null
          dispute_submitted_by: string | null
          dispute_transition_key: string | null
          document_ids: string[]
          due_date: string | null
          first_reviewer: string | null
          id: string
          owner_id: string | null
          page_id: string
          payload: Json
          priority: string
          revision: number
          status: string
          test_account: boolean
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          created_by: string
          creation_key: string
          creation_request: Json
          dispute_approved_at?: string | null
          dispute_change_note?: string | null
          dispute_legacy?: boolean | null
          dispute_opened_at?: string | null
          dispute_reference?: string | null
          dispute_required_reviews?: number | null
          dispute_reviewed_at?: string | null
          dispute_submitted_at?: string | null
          dispute_submitted_by?: string | null
          dispute_transition_key?: string | null
          document_ids?: string[]
          due_date?: string | null
          first_reviewer?: string | null
          id?: string
          owner_id?: string | null
          page_id: string
          payload?: Json
          priority?: string
          revision?: number
          status?: string
          test_account: boolean
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          created_by?: string
          creation_key?: string
          creation_request?: Json
          dispute_approved_at?: string | null
          dispute_change_note?: string | null
          dispute_legacy?: boolean | null
          dispute_opened_at?: string | null
          dispute_reference?: string | null
          dispute_required_reviews?: number | null
          dispute_reviewed_at?: string | null
          dispute_submitted_at?: string | null
          dispute_submitted_by?: string | null
          dispute_transition_key?: string | null
          document_ids?: string[]
          due_date?: string | null
          first_reviewer?: string | null
          id?: string
          owner_id?: string | null
          page_id?: string
          payload?: Json
          priority?: string
          revision?: number
          status?: string
          test_account?: boolean
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "intranet_records_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_records_dispute_submitted_by_fkey"
            columns: ["dispute_submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_records_first_reviewer_fkey"
            columns: ["first_reviewer"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_records_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_records_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "intranet_modules"
            referencedColumns: ["page_id"]
          },
        ]
      }
      intranet_share_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          decided_at: string | null
          decision_note: string | null
          document_id: string
          id: string
          reason: string
          recipient: string
          release_file_id: string | null
          released_at: string | null
          requested_by: string
          status: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          decision_note?: string | null
          document_id: string
          id?: string
          reason: string
          recipient: string
          release_file_id?: string | null
          released_at?: string | null
          requested_by: string
          status?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          decision_note?: string | null
          document_id?: string
          id?: string
          reason?: string
          recipient?: string
          release_file_id?: string | null
          released_at?: string | null
          requested_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "intranet_share_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_share_requests_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "intranet_drive_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intranet_share_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intranet_test_identity_events: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          kind: string
          role_key: string
          target_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          kind: string
          role_key: string
          target_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          kind?: string
          role_key?: string
          target_id?: string
        }
        Relationships: []
      }
      intranet_test_role_specs: {
        Row: {
          email: string
          label: string
          poles: string[]
          position: string
          role_key: string
          seniority: string
        }
        Insert: {
          email: string
          label: string
          poles: string[]
          position: string
          role_key: string
          seniority: string
        }
        Update: {
          email?: string
          label?: string
          poles?: string[]
          position?: string
          role_key?: string
          seniority?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_ht: number
          amount_ttc: number
          created_at: string
          currency: string
          id: string
          invoice_number: string
          issued_at: string
          kind: string
          order_id: string | null
          platform_id: string | null
          shop_id: string | null
          status: string
          updated_at: string
          vat_amount: number
        }
        Insert: {
          amount_ht?: number
          amount_ttc?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_number: string
          issued_at?: string
          kind?: string
          order_id?: string | null
          platform_id?: string | null
          shop_id?: string | null
          status?: string
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          amount_ht?: number
          amount_ttc?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string
          issued_at?: string
          kind?: string
          order_id?: string | null
          platform_id?: string | null
          shop_id?: string | null
          status?: string
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_catalog: {
        Row: {
          app_origin: string
          created_at: string
          created_by: string | null
          description: string | null
          formula: string | null
          frequency: string | null
          id: string
          name: string
          owner_id: string | null
          pole_access: string[]
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          version: string
        }
        Insert: {
          app_origin?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          formula?: string | null
          frequency?: string | null
          id?: string
          name: string
          owner_id?: string | null
          pole_access?: string[]
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          version?: string
        }
        Update: {
          app_origin?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          formula?: string | null
          frequency?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          pole_access?: string[]
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      kpi_versions: {
        Row: {
          change_note: string | null
          changed_by: string | null
          created_at: string
          id: string
          kpi_id: string
          snapshot: Json
          version: string
        }
        Insert: {
          change_note?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          kpi_id: string
          snapshot: Json
          version: string
        }
        Update: {
          change_note?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          kpi_id?: string
          snapshot?: Json
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_versions_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_governance_deliveries: {
        Row: {
          delivered_at: string | null
          delivery_sequence: number
          record_id: string
          state: string
        }
        Insert: {
          delivered_at?: string | null
          delivery_sequence: number
          record_id: string
          state?: string
        }
        Update: {
          delivered_at?: string | null
          delivery_sequence?: number
          record_id?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_governance_deliveries_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "legal_governance_records"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_governance_events: {
        Row: {
          action: string
          actor_id: string
          after_state: Json
          before_state: Json | null
          command_key: string
          created_at: string
          id: string
          record_id: string
          request: Json
        }
        Insert: {
          action: string
          actor_id: string
          after_state: Json
          before_state?: Json | null
          command_key: string
          created_at?: string
          id?: string
          record_id: string
          request: Json
        }
        Update: {
          action?: string
          actor_id?: string
          after_state?: Json
          before_state?: Json | null
          command_key?: string
          created_at?: string
          id?: string
          record_id?: string
          request?: Json
        }
        Relationships: [
          {
            foreignKeyName: "legal_governance_events_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "legal_governance_records"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_governance_records: {
        Row: {
          activation_sequence: number | null
          command_key: string
          command_payload: Json
          command_revision: number
          created_at: string
          created_by: string
          creation_key: string
          creation_request: Json
          delivery_sequence: number
          direction_evidence: string | null
          direction_reviewer: string | null
          id: string
          kind: string
          last_action: string
          legal_evidence: string | null
          legal_reviewer: string | null
          payload: Json
          reason: string | null
          revision: number
          state: string
          test_account: boolean
          updated_at: string
        }
        Insert: {
          activation_sequence?: number | null
          command_key: string
          command_payload?: Json
          command_revision?: number
          created_at?: string
          created_by: string
          creation_key: string
          creation_request: Json
          delivery_sequence?: number
          direction_evidence?: string | null
          direction_reviewer?: string | null
          id?: string
          kind: string
          last_action?: string
          legal_evidence?: string | null
          legal_reviewer?: string | null
          payload: Json
          reason?: string | null
          revision?: number
          state?: string
          test_account?: boolean
          updated_at?: string
        }
        Update: {
          activation_sequence?: number | null
          command_key?: string
          command_payload?: Json
          command_revision?: number
          created_at?: string
          created_by?: string
          creation_key?: string
          creation_request?: Json
          delivery_sequence?: number
          direction_evidence?: string | null
          direction_reviewer?: string | null
          id?: string
          kind?: string
          last_action?: string
          legal_evidence?: string | null
          legal_reviewer?: string | null
          payload?: Json
          reason?: string | null
          revision?: number
          state?: string
          test_account?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      lifecycle_email_campaigns: {
        Row: {
          audience: string | null
          body: string | null
          click_rate: number | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          open_rate: number | null
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          audience?: string | null
          body?: string | null
          click_rate?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          open_rate?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          audience?: string | null
          body?: string | null
          click_rate?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          open_rate?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      lifecycle_risk_alerts: {
        Row: {
          amount: number | null
          assigned_to: string | null
          company: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
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
      marketplace_customer_favorites: {
        Row: {
          created_at: string
          favorite_type: string
          id: string
          platform_boutique_id: string | null
          platform_synced_at: string
          platform_target_id: string
          platform_user_id: string
          shop_id: string | null
          source: string
          target_name: string | null
          target_sku: string | null
        }
        Insert: {
          created_at?: string
          favorite_type: string
          id?: string
          platform_boutique_id?: string | null
          platform_synced_at?: string
          platform_target_id: string
          platform_user_id: string
          shop_id?: string | null
          source?: string
          target_name?: string | null
          target_sku?: string | null
        }
        Update: {
          created_at?: string
          favorite_type?: string
          id?: string
          platform_boutique_id?: string | null
          platform_synced_at?: string
          platform_target_id?: string
          platform_user_id?: string
          shop_id?: string | null
          source?: string
          target_name?: string | null
          target_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_customer_favorites_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
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
      merchant_payouts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_id: string | null
          paid_at: string | null
          platform_id: string | null
          shop_id: string | null
          status: string
          stripe_payout_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string | null
          paid_at?: string | null
          platform_id?: string | null
          shop_id?: string | null
          status?: string
          stripe_payout_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string | null
          paid_at?: string | null
          platform_id?: string | null
          shop_id?: string | null
          status?: string
          stripe_payout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_payouts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_portfolio_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          ended_at: string | null
          id: string
          merchant_id: string
          portfolio_id: string
          reason: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          ended_at?: string | null
          id?: string
          merchant_id: string
          portfolio_id: string
          reason?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          ended_at?: string | null
          id?: string
          merchant_id?: string
          portfolio_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_portfolio_assignments_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "merchant_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_portfolio_owner_events: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          new_owner_id: string | null
          portfolio_id: string
          previous_owner_id: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          new_owner_id?: string | null
          portfolio_id: string
          previous_owner_id?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          new_owner_id?: string | null
          portfolio_id?: string
          previous_owner_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_portfolio_owner_events_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "merchant_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_portfolios: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          owner_id: string | null
          role_scope: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          owner_id?: string | null
          role_scope?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string | null
          role_scope?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      merchant_supply_events: {
        Row: {
          action: string
          actor_id: string | null
          command_key: string
          created_at: string
          id: string
          quote_id: string
          request: Json
          result: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          command_key: string
          created_at?: string
          id?: string
          quote_id: string
          request: Json
          result: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          command_key?: string
          created_at?: string
          id?: string
          quote_id?: string
          request?: Json
          result?: Json
        }
        Relationships: [
          {
            foreignKeyName: "merchant_supply_events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "merchant_supply_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_supply_invoice_refs: {
        Row: {
          issuer_entity_id: string
          quote_id: string
          reference: string
          test_account: boolean
        }
        Insert: {
          issuer_entity_id: string
          quote_id: string
          reference: string
          test_account: boolean
        }
        Update: {
          issuer_entity_id?: string
          quote_id?: string
          reference?: string
          test_account?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "merchant_supply_invoice_refs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "merchant_supply_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_supply_quotes: {
        Row: {
          acceptance: Json | null
          approval_reference: string | null
          approved_by: string | null
          boutique_id: string
          catalog_id: string
          command_key: string
          command_payload: Json
          coverage: Json | null
          created_at: string
          created_by: string
          creation_key: string
          creation_request: Json
          id: string
          invoice_documents: Json
          last_action: string
          merchant_id: string
          payload: Json
          payment_evidence: Json
          product_name: string
          quote_author: string
          quote_hash: string
          quote_version: number
          reference: string
          revision: number
          source_request_id: string | null
          state: string
          supplier_id: string
          test_account: boolean
          totals: Json
          updated_at: string
        }
        Insert: {
          acceptance?: Json | null
          approval_reference?: string | null
          approved_by?: string | null
          boutique_id: string
          catalog_id: string
          command_key: string
          command_payload?: Json
          coverage?: Json | null
          created_at?: string
          created_by: string
          creation_key: string
          creation_request: Json
          id?: string
          invoice_documents?: Json
          last_action?: string
          merchant_id: string
          payload: Json
          payment_evidence?: Json
          product_name?: string
          quote_author: string
          quote_hash?: string
          quote_version?: number
          reference?: string
          revision?: number
          source_request_id?: string | null
          state?: string
          supplier_id: string
          test_account?: boolean
          totals?: Json
          updated_at?: string
        }
        Update: {
          acceptance?: Json | null
          approval_reference?: string | null
          approved_by?: string | null
          boutique_id?: string
          catalog_id?: string
          command_key?: string
          command_payload?: Json
          coverage?: Json | null
          created_at?: string
          created_by?: string
          creation_key?: string
          creation_request?: Json
          id?: string
          invoice_documents?: Json
          last_action?: string
          merchant_id?: string
          payload?: Json
          payment_evidence?: Json
          product_name?: string
          quote_author?: string
          quote_hash?: string
          quote_version?: number
          reference?: string
          revision?: number
          source_request_id?: string | null
          state?: string
          supplier_id?: string
          test_account?: boolean
          totals?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_supply_quotes_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_supply_quotes_source_request_id_fkey"
            columns: ["source_request_id"]
            isOneToOne: false
            referencedRelation: "merchant_supply_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_supply_quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_supply_requests: {
        Row: {
          boutique_id: string
          buyer_entity_id: string
          catalog_id: string
          created_at: string
          id: string
          merchant_id: string
          quote_id: string | null
          request: Json
          request_key: string
          state: string
          test_account: boolean
        }
        Insert: {
          boutique_id: string
          buyer_entity_id: string
          catalog_id: string
          created_at?: string
          id?: string
          merchant_id: string
          quote_id?: string | null
          request: Json
          request_key: string
          state?: string
          test_account: boolean
        }
        Update: {
          boutique_id?: string
          buyer_entity_id?: string
          catalog_id?: string
          created_at?: string
          id?: string
          merchant_id?: string
          quote_id?: string | null
          request?: Json
          request_key?: string
          state?: string
          test_account?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "merchant_supply_requests_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_supply_requests_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "merchant_supply_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_supply_settlements: {
        Row: {
          evidence: Json
          quote_id: string
          revision: number
          state: string
          updated_at: string
        }
        Insert: {
          evidence: Json
          quote_id: string
          revision: number
          state: string
          updated_at?: string
        }
        Update: {
          evidence?: Json
          quote_id?: string
          revision?: number
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_supply_settlements_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "merchant_supply_quotes"
            referencedColumns: ["id"]
          },
        ]
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
          app_origin: string
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
          app_origin?: string
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
          app_origin?: string
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
          platform_id: string | null
          platform_synced_at: string | null
          region: string | null
          shipped_at: string | null
          shipping_address: string | null
          shipping_method: string | null
          shop_id: string | null
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
          platform_id?: string | null
          platform_synced_at?: string | null
          region?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_method?: string | null
          shop_id?: string | null
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
          platform_id?: string | null
          platform_synced_at?: string | null
          region?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_method?: string | null
          shop_id?: string | null
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
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
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
      permission_change_log: {
        Row: {
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          performed_by: string | null
          setting_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string | null
          setting_key: string
        }
        Update: {
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string | null
          setting_key?: string
        }
        Relationships: []
      }
      permission_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      platform_boutique_products: {
        Row: {
          intranet_product_id: string
          platform_boutique_id: string
          platform_product_id: string
          platform_supplier_product_id: string
          platform_synced_at: string
          public_price: number | null
          public_status: string | null
          shop_id: string
        }
        Insert: {
          intranet_product_id: string
          platform_boutique_id: string
          platform_product_id: string
          platform_supplier_product_id: string
          platform_synced_at?: string
          public_price?: number | null
          public_status?: string | null
          shop_id: string
        }
        Update: {
          intranet_product_id?: string
          platform_boutique_id?: string
          platform_product_id?: string
          platform_supplier_product_id?: string
          platform_synced_at?: string
          public_price?: number | null
          public_status?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_boutique_products_intranet_product_id_fkey"
            columns: ["intranet_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_boutique_products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_bridge_state: {
        Row: {
          name: string
          snapshot_at: string
        }
        Insert: {
          name: string
          snapshot_at: string
        }
        Update: {
          name?: string
          snapshot_at?: string
        }
        Relationships: []
      }
      platform_customization_requests: {
        Row: {
          id: string
          intranet_product_id: string
          merchant_config: Json
          platform_dossier_id: string
          platform_product_id: string
          source_updated_at: string
          supplier_comment: string | null
          supplier_status: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          intranet_product_id: string
          merchant_config?: Json
          platform_dossier_id: string
          platform_product_id: string
          source_updated_at: string
          supplier_comment?: string | null
          supplier_status: string
          updated_at?: string
          version: number
        }
        Update: {
          id?: string
          intranet_product_id?: string
          merchant_config?: Json
          platform_dossier_id?: string
          platform_product_id?: string
          source_updated_at?: string
          supplier_comment?: string | null
          supplier_status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_customization_requests_intranet_product_id_fkey"
            columns: ["intranet_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_stock_restock_requests: {
        Row: {
          boutique_name: string | null
          catalog_moq: number
          created_at: string
          id: string
          note: string | null
          platform_boutique_id: string
          platform_product_id: string
          platform_request_id: string
          platform_supplier_product_id: string
          platform_synced_at: string
          product_id: string
          product_name: string
          requested_quantity: number
          review_comment: string | null
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          boutique_name?: string | null
          catalog_moq: number
          created_at: string
          id?: string
          note?: string | null
          platform_boutique_id: string
          platform_product_id: string
          platform_request_id: string
          platform_supplier_product_id: string
          platform_synced_at?: string
          product_id: string
          product_name: string
          requested_quantity: number
          review_comment?: string | null
          status: string
          updated_at: string
          version: number
        }
        Update: {
          boutique_name?: string | null
          catalog_moq?: number
          created_at?: string
          id?: string
          note?: string | null
          platform_boutique_id?: string
          platform_product_id?: string
          platform_request_id?: string
          platform_supplier_product_id?: string
          platform_synced_at?: string
          product_id?: string
          product_name?: string
          requested_quantity?: number
          review_comment?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_stock_restock_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_sync_runs: {
        Row: {
          action: string
          details: Json | null
          direction: string
          errors: Json
          finished_at: string | null
          id: string
          items_count: number
          started_at: string
          status: string
          triggered_by: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          direction: string
          errors?: Json
          finished_at?: string | null
          id?: string
          items_count?: number
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          direction?: string
          errors?: Json
          finished_at?: string | null
          id?: string
          items_count?: number
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
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
      product_release_tracking: {
        Row: {
          app_key: string
          change_reference: string | null
          created_at: string
          created_by: string
          deployed_at: string | null
          environment: string
          id: string
          request_id: string
          reviewed_at: string | null
          reviewer_id: string | null
          rollback_reference: string | null
          security_reference: string | null
          status: string
          test_reference: string | null
          updated_at: string
          updated_by: string
          version: string
        }
        Insert: {
          app_key: string
          change_reference?: string | null
          created_at?: string
          created_by: string
          deployed_at?: string | null
          environment: string
          id?: string
          request_id: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          rollback_reference?: string | null
          security_reference?: string | null
          status?: string
          test_reference?: string | null
          updated_at?: string
          updated_by: string
          version: string
        }
        Update: {
          app_key?: string
          change_reference?: string | null
          created_at?: string
          created_by?: string
          deployed_at?: string | null
          environment?: string
          id?: string
          request_id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          rollback_reference?: string | null
          security_reference?: string | null
          status?: string
          test_reference?: string | null
          updated_at?: string
          updated_by?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_release_tracking_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tech_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      product_release_tracking_events: {
        Row: {
          actor_id: string
          at: string
          id: string
          new_status: string
          note: string
          old_status: string | null
          release_id: string
        }
        Insert: {
          actor_id: string
          at?: string
          id?: string
          new_status: string
          note: string
          old_status?: string | null
          release_id: string
        }
        Update: {
          actor_id?: string
          at?: string
          id?: string
          new_status?: string
          note?: string
          old_status?: string | null
          release_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_release_tracking_events_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "product_release_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      product_work_events: {
        Row: {
          actor_id: string
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          kind: string
          note: string | null
          record_id: string
        }
        Insert: {
          actor_id: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          record_id: string
        }
        Update: {
          actor_id?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_work_events_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "product_work_records"
            referencedColumns: ["id"]
          },
        ]
      }
      product_work_records: {
        Row: {
          approved_by: string | null
          client_key: string
          created_at: string
          created_by: string
          document_ids: string[]
          due_date: string | null
          first_reviewer: string | null
          id: string
          owner_id: string | null
          page_id: string
          payload: Json
          priority: string
          revision: number
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          approved_by?: string | null
          client_key: string
          created_at?: string
          created_by: string
          document_ids?: string[]
          due_date?: string | null
          first_reviewer?: string | null
          id?: string
          owner_id?: string | null
          page_id: string
          payload?: Json
          priority?: string
          revision?: number
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          approved_by?: string | null
          client_key?: string
          created_at?: string
          created_by?: string
          document_ids?: string[]
          due_date?: string | null
          first_reviewer?: string | null
          id?: string
          owner_id?: string | null
          page_id?: string
          payload?: Json
          priority?: string
          revision?: number
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string
          currency: string | null
          customization_capabilities: Json
          customization_terms: Json
          description: string | null
          dimensions: string | null
          gallery: string[] | null
          id: string
          image_url: string | null
          ingredients: string | null
          lifecycle_status: string
          margin: number | null
          moq: number | null
          name: string
          origin: string | null
          packaging_status: string | null
          platform_id: string | null
          platform_publish_status: string | null
          platform_synced_at: string | null
          product_sheet_url: string | null
          rejection_reason: string | null
          selling_price: number | null
          shelf_life: string | null
          sku: string | null
          status: string
          supplier_id: string
          tech_integration_status: string | null
          test_account: boolean
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
          customization_capabilities?: Json
          customization_terms?: Json
          description?: string | null
          dimensions?: string | null
          gallery?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          lifecycle_status?: string
          margin?: number | null
          moq?: number | null
          name: string
          origin?: string | null
          packaging_status?: string | null
          platform_id?: string | null
          platform_publish_status?: string | null
          platform_synced_at?: string | null
          product_sheet_url?: string | null
          rejection_reason?: string | null
          selling_price?: number | null
          shelf_life?: string | null
          sku?: string | null
          status?: string
          supplier_id: string
          tech_integration_status?: string | null
          test_account?: boolean
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
          customization_capabilities?: Json
          customization_terms?: Json
          description?: string | null
          dimensions?: string | null
          gallery?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          lifecycle_status?: string
          margin?: number | null
          moq?: number | null
          name?: string
          origin?: string | null
          packaging_status?: string | null
          platform_id?: string | null
          platform_publish_status?: string | null
          platform_synced_at?: string | null
          product_sheet_url?: string | null
          rejection_reason?: string | null
          selling_price?: number | null
          shelf_life?: string | null
          sku?: string | null
          status?: string
          supplier_id?: string
          tech_integration_status?: string | null
          test_account?: boolean
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
          app_origin: string
          avatar_url: string | null
          collaborator_type: string
          created_at: string | null
          email: string
          first_name: string
          hr_status: string
          id: string
          last_name: string
          manager_id: string | null
          poles: Database["public"]["Enums"]["pole_id"][] | null
          position: Database["public"]["Enums"]["employee_position"] | null
          position_key: string | null
          seniority: string | null
          subsidiary: string | null
          test_account: boolean
          updated_at: string | null
          work_mode: string | null
        }
        Insert: {
          app_origin?: string
          avatar_url?: string | null
          collaborator_type?: string
          created_at?: string | null
          email: string
          first_name: string
          hr_status?: string
          id: string
          last_name: string
          manager_id?: string | null
          poles?: Database["public"]["Enums"]["pole_id"][] | null
          position?: Database["public"]["Enums"]["employee_position"] | null
          position_key?: string | null
          seniority?: string | null
          subsidiary?: string | null
          test_account?: boolean
          updated_at?: string | null
          work_mode?: string | null
        }
        Update: {
          app_origin?: string
          avatar_url?: string | null
          collaborator_type?: string
          created_at?: string | null
          email?: string
          first_name?: string
          hr_status?: string
          id?: string
          last_name?: string
          manager_id?: string | null
          poles?: Database["public"]["Enums"]["pole_id"][] | null
          position?: Database["public"]["Enums"]["employee_position"] | null
          position_key?: string | null
          seniority?: string | null
          subsidiary?: string | null
          test_account?: boolean
          updated_at?: string | null
          work_mode?: string | null
        }
        Relationships: []
      }
      publication_reads: {
        Row: {
          publication_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          publication_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          publication_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_reads_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_requests: {
        Row: {
          app_origin: string
          created_at: string
          data_validator: string | null
          deployed_at: string | null
          description: string | null
          history: Json | null
          id: string
          notes: string | null
          priority: string | null
          related_kpi_id: string | null
          request_type: string
          requested_by: string | null
          status: string
          target_deploy_date: string | null
          tech_assignee: string | null
          title: string
          updated_at: string
        }
        Insert: {
          app_origin?: string
          created_at?: string
          data_validator?: string | null
          deployed_at?: string | null
          description?: string | null
          history?: Json | null
          id?: string
          notes?: string | null
          priority?: string | null
          related_kpi_id?: string | null
          request_type: string
          requested_by?: string | null
          status?: string
          target_deploy_date?: string | null
          tech_assignee?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          app_origin?: string
          created_at?: string
          data_validator?: string | null
          deployed_at?: string | null
          description?: string | null
          history?: Json | null
          id?: string
          notes?: string | null
          priority?: string | null
          related_kpi_id?: string | null
          request_type?: string
          requested_by?: string | null
          status?: string
          target_deploy_date?: string | null
          tech_assignee?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_requests_related_kpi_id_fkey"
            columns: ["related_kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          app_origin: string
          archive_at: string | null
          author_id: string | null
          author_pole: string | null
          available_at: string | null
          body: string | null
          created_at: string
          id: string
          metadata: Json | null
          publish_at: string | null
          related_kpi_id: string | null
          status: string
          subtype: string | null
          summary: string | null
          title: string
          type: string
          updated_at: string
          version: string
          visibility_scope: string
          visibility_targets: string[]
        }
        Insert: {
          app_origin?: string
          archive_at?: string | null
          author_id?: string | null
          author_pole?: string | null
          available_at?: string | null
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          publish_at?: string | null
          related_kpi_id?: string | null
          status?: string
          subtype?: string | null
          summary?: string | null
          title: string
          type: string
          updated_at?: string
          version?: string
          visibility_scope?: string
          visibility_targets?: string[]
        }
        Update: {
          app_origin?: string
          archive_at?: string | null
          author_id?: string | null
          author_pole?: string | null
          available_at?: string | null
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          publish_at?: string | null
          related_kpi_id?: string | null
          status?: string
          subtype?: string | null
          summary?: string | null
          title?: string
          type?: string
          updated_at?: string
          version?: string
          visibility_scope?: string
          visibility_targets?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "publications_related_kpi_id_fkey"
            columns: ["related_kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_alert_comments: {
        Row: {
          actor_id: string
          alert_id: string
          body: string
          created_at: string
          id: string
        }
        Insert: {
          actor_id?: string
          alert_id: string
          body: string
          created_at?: string
          id?: string
        }
        Update: {
          actor_id?: string
          alert_id?: string
          body?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_alert_comments_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_alert_comments_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "quality_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_alerts: {
        Row: {
          approval_levels: number
          archived_at: string | null
          assigned_to: string | null
          change_note: string | null
          closed_at: string | null
          closed_by: string | null
          corrective_action: string | null
          corrective_due_date: string | null
          created_at: string
          creation_key: string | null
          creation_request: Json | null
          description: string
          document_ids: string[]
          evidence: string | null
          first_reviewer: string | null
          id: string
          is_nonconformity: boolean
          legacy_record: boolean
          origin_page: string | null
          product_id: string | null
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          reviewed_at: string | null
          revision: number
          severity: string
          status: string
          supplier_id: string | null
          test_account: boolean
          title: string
          updated_at: string
        }
        Insert: {
          approval_levels?: number
          archived_at?: string | null
          assigned_to?: string | null
          change_note?: string | null
          closed_at?: string | null
          closed_by?: string | null
          corrective_action?: string | null
          corrective_due_date?: string | null
          created_at?: string
          creation_key?: string | null
          creation_request?: Json | null
          description: string
          document_ids?: string[]
          evidence?: string | null
          first_reviewer?: string | null
          id?: string
          is_nonconformity?: boolean
          legacy_record?: boolean
          origin_page?: string | null
          product_id?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          reviewed_at?: string | null
          revision?: number
          severity: string
          status?: string
          supplier_id?: string | null
          test_account?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          approval_levels?: number
          archived_at?: string | null
          assigned_to?: string | null
          change_note?: string | null
          closed_at?: string | null
          closed_by?: string | null
          corrective_action?: string | null
          corrective_due_date?: string | null
          created_at?: string
          creation_key?: string | null
          creation_request?: Json | null
          description?: string
          document_ids?: string[]
          evidence?: string | null
          first_reviewer?: string | null
          id?: string
          is_nonconformity?: boolean
          legacy_record?: boolean
          origin_page?: string | null
          product_id?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          reviewed_at?: string | null
          revision?: number
          severity?: string
          status?: string
          supplier_id?: string | null
          test_account?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_alerts_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_alerts_first_reviewer_fkey"
            columns: ["first_reviewer"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      rd_recommendations: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          detail: string
          id: string
          priority: string
          report_id: string | null
          status: string
          target_pole: Database["public"]["Enums"]["pole_id"] | null
          ticket_id: string | null
          ticket_type: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          detail: string
          id?: string
          priority?: string
          report_id?: string | null
          status?: string
          target_pole?: Database["public"]["Enums"]["pole_id"] | null
          ticket_id?: string | null
          ticket_type?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          detail?: string
          id?: string
          priority?: string
          report_id?: string | null
          status?: string
          target_pole?: Database["public"]["Enums"]["pole_id"] | null
          ticket_id?: string | null
          ticket_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rd_recommendations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "rd_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      rd_reports: {
        Row: {
          author_id: string | null
          author_name: string | null
          created_at: string
          id: string
          published_at: string | null
          status: string
          summary: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          status?: string
          summary?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          status?: string
          summary?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      reconciliation_items: {
        Row: {
          anomaly_id: string | null
          commission_amount: number | null
          computed_at: string
          expected_payout: number | null
          gaps: string[]
          id: string
          invoice_amount: number | null
          order_amount: number
          order_id: string
          payout_amount: number | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shop_id: string | null
          status: string
          stripe_amount: number | null
          stripe_fee: number | null
        }
        Insert: {
          anomaly_id?: string | null
          commission_amount?: number | null
          computed_at?: string
          expected_payout?: number | null
          gaps?: string[]
          id?: string
          invoice_amount?: number | null
          order_amount?: number
          order_id: string
          payout_amount?: number | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_id?: string | null
          status?: string
          stripe_amount?: number | null
          stripe_fee?: number | null
        }
        Update: {
          anomaly_id?: string | null
          commission_amount?: number | null
          computed_at?: string
          expected_payout?: number | null
          gaps?: string[]
          id?: string
          invoice_amount?: number | null
          order_amount?: number
          order_id?: string
          payout_amount?: number | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_id?: string | null
          status?: string
          stripe_amount?: number | null
          stripe_fee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_items_anomaly_id_fkey"
            columns: ["anomaly_id"]
            isOneToOne: false
            referencedRelation: "anomalies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_items_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
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
      rh_employee_documents: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          document_date: string | null
          document_type: string
          document_url: string | null
          employee_id: string
          expires_at: string | null
          id: string
          name: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_date?: string | null
          document_type?: string
          document_url?: string | null
          employee_id: string
          expires_at?: string | null
          id?: string
          name: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_date?: string | null
          document_type?: string
          document_url?: string | null
          employee_id?: string
          expires_at?: string | null
          id?: string
          name?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      rh_position_catalog: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          label: string
          pole_id: string
          position_key: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          label: string
          pole_id: string
          position_key: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          label?: string
          pole_id?: string
          position_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_position_catalog_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      sav_escalation_queue: {
        Row: {
          acknowledged_at: string | null
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          due_at: string
          environment: string
          escalated_at: string
          issue_id: string
          platform_boutique_id: string
          platform_merchant_id: string
          platform_order_id: string
          reason: string
          resolution_note: string | null
          status: string
        }
        Insert: {
          acknowledged_at?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          due_at: string
          environment: string
          escalated_at: string
          issue_id: string
          platform_boutique_id: string
          platform_merchant_id: string
          platform_order_id: string
          reason?: string
          resolution_note?: string | null
          status?: string
        }
        Update: {
          acknowledged_at?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          due_at?: string
          environment?: string
          escalated_at?: string
          issue_id?: string
          platform_boutique_id?: string
          platform_merchant_id?: string
          platform_order_id?: string
          reason?: string
          resolution_note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sav_escalation_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sav_escalation_queue_events: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          issue_id: string
          note: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          issue_id: string
          note?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          issue_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sav_escalation_queue_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sav_escalation_queue_events_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "sav_escalation_queue"
            referencedColumns: ["issue_id"]
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
      shop_status_events: {
        Row: {
          action: string | null
          from_status: string | null
          id: string
          performed_at: string
          performed_by: string | null
          reason: string | null
          shop_id: string
          to_status: string
        }
        Insert: {
          action?: string | null
          from_status?: string | null
          id?: string
          performed_at?: string
          performed_by?: string | null
          reason?: string | null
          shop_id: string
          to_status: string
        }
        Update: {
          action?: string | null
          from_status?: string | null
          id?: string
          performed_at?: string
          performed_by?: string | null
          reason?: string | null
          shop_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_status_events_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          activated_at: string | null
          app_origin: string
          category: string | null
          closed_at: string | null
          commission_rate: number | null
          contract_signed_at: string | null
          contract_status: string | null
          country: string | null
          created_at: string
          created_by: string | null
          id: string
          merchant_email: string | null
          merchant_name: string | null
          merchant_phone: string | null
          name: string
          notes: string | null
          platform_id: string | null
          platform_synced_at: string | null
          shop_code: string
          slug: string | null
          status: string
          subscription_plan: string | null
          suspended_at: string | null
          suspension_reason: string | null
          test_ends_at: string | null
          test_extensions: number
          test_started_at: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          app_origin?: string
          category?: string | null
          closed_at?: string | null
          commission_rate?: number | null
          contract_signed_at?: string | null
          contract_status?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          merchant_email?: string | null
          merchant_name?: string | null
          merchant_phone?: string | null
          name: string
          notes?: string | null
          platform_id?: string | null
          platform_synced_at?: string | null
          shop_code: string
          slug?: string | null
          status?: string
          subscription_plan?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          test_ends_at?: string | null
          test_extensions?: number
          test_started_at?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          app_origin?: string
          category?: string | null
          closed_at?: string | null
          commission_rate?: number | null
          contract_signed_at?: string | null
          contract_status?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          merchant_email?: string | null
          merchant_name?: string | null
          merchant_phone?: string | null
          name?: string
          notes?: string | null
          platform_id?: string | null
          platform_synced_at?: string | null
          shop_code?: string
          slug?: string | null
          status?: string
          subscription_plan?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          test_ends_at?: string | null
          test_extensions?: number
          test_started_at?: string | null
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
      stripe_events: {
        Row: {
          amount: number
          created_at: string
          currency: string
          event_type: string
          fee_amount: number
          id: string
          occurred_at: string
          order_id: string | null
          order_number: string | null
          payment_intent: string | null
          shop_id: string | null
          status: string
          stripe_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          event_type?: string
          fee_amount?: number
          id?: string
          occurred_at?: string
          order_id?: string | null
          order_number?: string | null
          payment_intent?: string | null
          shop_id?: string | null
          status?: string
          stripe_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          event_type?: string
          fee_amount?: number
          id?: string
          occurred_at?: string
          order_id?: string | null
          order_number?: string | null
          payment_intent?: string | null
          shop_id?: string | null
          status?: string
          stripe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_events_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_application_events: {
        Row: {
          application_id: string
          created_at: string
          event_type: string
          from_status: string | null
          id: string
          metadata: Json
          notes: string | null
          performed_by: string | null
          to_status: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          event_type: string
          from_status?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          performed_by?: string | null
          to_status?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          event_type?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          performed_by?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "supplier_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_applications: {
        Row: {
          assigned_at: string | null
          assigned_to_id: string | null
          assigned_to_name: string | null
          audit_accepted: boolean
          blocking_criteria: string[]
          category: string | null
          certifications: Json
          company_name: string
          contact_email: string
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          decision_at: string | null
          decision_by: string | null
          decision_notes: string | null
          documents: Json
          id: string
          lead_time_days: number | null
          moq: number | null
          priority: string
          raw_payload: Json
          score: number
          source: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to_id?: string | null
          assigned_to_name?: string | null
          audit_accepted?: boolean
          blocking_criteria?: string[]
          category?: string | null
          certifications?: Json
          company_name: string
          contact_email: string
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          decision_at?: string | null
          decision_by?: string | null
          decision_notes?: string | null
          documents?: Json
          id?: string
          lead_time_days?: number | null
          moq?: number | null
          priority?: string
          raw_payload?: Json
          score?: number
          source?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to_id?: string | null
          assigned_to_name?: string | null
          audit_accepted?: boolean
          blocking_criteria?: string[]
          category?: string | null
          certifications?: Json
          company_name?: string
          contact_email?: string
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          decision_at?: string | null
          decision_by?: string | null
          decision_notes?: string | null
          documents?: Json
          id?: string
          lead_time_days?: number | null
          moq?: number | null
          priority?: string
          raw_payload?: Json
          score?: number
          source?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_assignment_events: {
        Row: {
          actor_id: string
          created_at: string
          employee_id: string | null
          id: string
          portfolio_id: string | null
          previous_employee_id: string | null
          previous_portfolio_id: string | null
          reason: string | null
          supplier_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          employee_id?: string | null
          id?: string
          portfolio_id?: string | null
          previous_employee_id?: string | null
          previous_portfolio_id?: string | null
          reason?: string | null
          supplier_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          employee_id?: string | null
          id?: string
          portfolio_id?: string | null
          previous_employee_id?: string | null
          previous_portfolio_id?: string | null
          reason?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_assignment_events_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "supplier_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_assignment_events_previous_portfolio_id_fkey"
            columns: ["previous_portfolio_id"]
            isOneToOne: false
            referencedRelation: "supplier_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_assignment_events_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_audit_bank_receipts: {
        Row: {
          amount_cents: number
          bank_statement_reference: string
          bank_transaction_reference: string
          case_id: string
          credited_on: string
          currency: string
          id: string
          test_account: boolean
          verified_at: string
          verified_by: string
        }
        Insert: {
          amount_cents: number
          bank_statement_reference: string
          bank_transaction_reference: string
          case_id: string
          credited_on: string
          currency?: string
          id?: string
          test_account: boolean
          verified_at?: string
          verified_by: string
        }
        Update: {
          amount_cents?: number
          bank_statement_reference?: string
          bank_transaction_reference?: string
          case_id?: string
          credited_on?: string
          currency?: string
          id?: string
          test_account?: boolean
          verified_at?: string
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_audit_bank_receipts_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "supplier_audit_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_audit_case_events: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json
          before_state: Json | null
          case_id: string
          command_key: string
          created_at: string
          event_order: number
          id: string
          portal_submission_id: string | null
          request: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state: Json
          before_state?: Json | null
          case_id: string
          command_key: string
          created_at?: string
          event_order?: never
          id?: string
          portal_submission_id?: string | null
          request: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json
          before_state?: Json | null
          case_id?: string
          command_key?: string
          created_at?: string
          event_order?: never
          id?: string
          portal_submission_id?: string | null
          request?: Json
        }
        Relationships: [
          {
            foreignKeyName: "supplier_audit_case_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "supplier_audit_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_audit_cases: {
        Row: {
          acceptance: Json | null
          command_key: string
          command_payload: Json
          command_revision: number
          contract_effective_on: string | null
          contract_reference: string | null
          created_at: string
          created_by: string
          creation_key: string
          creation_request: Json
          id: string
          incident_reference: string | null
          invoice: Json | null
          kind: string
          last_action: string
          payments: Json
          quote: Json | null
          quote_approved_by: string | null
          quote_author: string | null
          quote_hash: string | null
          quote_state: string
          quote_version: number
          reason: string | null
          reference_decisions: Json | null
          report: Json | null
          report_approved_by: string | null
          report_author: string | null
          report_hash: string | null
          revision: number
          scope: string[]
          state: string
          supplier_id: string
          supplier_name: string
          test_account: boolean
          updated_at: string
        }
        Insert: {
          acceptance?: Json | null
          command_key: string
          command_payload?: Json
          command_revision?: number
          contract_effective_on?: string | null
          contract_reference?: string | null
          created_at?: string
          created_by: string
          creation_key: string
          creation_request: Json
          id?: string
          incident_reference?: string | null
          invoice?: Json | null
          kind: string
          last_action?: string
          payments?: Json
          quote?: Json | null
          quote_approved_by?: string | null
          quote_author?: string | null
          quote_hash?: string | null
          quote_state?: string
          quote_version?: number
          reason?: string | null
          reference_decisions?: Json | null
          report?: Json | null
          report_approved_by?: string | null
          report_author?: string | null
          report_hash?: string | null
          revision?: number
          scope: string[]
          state?: string
          supplier_id: string
          supplier_name?: string
          test_account?: boolean
          updated_at?: string
        }
        Update: {
          acceptance?: Json | null
          command_key?: string
          command_payload?: Json
          command_revision?: number
          contract_effective_on?: string | null
          contract_reference?: string | null
          created_at?: string
          created_by?: string
          creation_key?: string
          creation_request?: Json
          id?: string
          incident_reference?: string | null
          invoice?: Json | null
          kind?: string
          last_action?: string
          payments?: Json
          quote?: Json | null
          quote_approved_by?: string | null
          quote_author?: string | null
          quote_hash?: string | null
          quote_state?: string
          quote_version?: number
          reason?: string | null
          reference_decisions?: Json | null
          report?: Json | null
          report_approved_by?: string | null
          report_author?: string | null
          report_hash?: string | null
          revision?: number
          scope?: string[]
          state?: string
          supplier_id?: string
          supplier_name?: string
          test_account?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_audit_cases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_audit_document_manifest: {
        Row: {
          case_id: string
          document_kind: string
          document_reference: string
          id: string
          recorded_at: string
          recorded_by: string
          sha256_hex: string
          test_account: boolean
          version_label: string
        }
        Insert: {
          case_id: string
          document_kind: string
          document_reference: string
          id?: string
          recorded_at?: string
          recorded_by: string
          sha256_hex: string
          test_account: boolean
          version_label: string
        }
        Update: {
          case_id?: string
          document_kind?: string
          document_reference?: string
          id?: string
          recorded_at?: string
          recorded_by?: string
          sha256_hex?: string
          test_account?: boolean
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_audit_document_manifest_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "supplier_audit_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_audit_payment_evidence: {
        Row: {
          amount_cents: number
          case_id: string
          created_at: string
          id: string
          payment_reference: string
          test_account: boolean
        }
        Insert: {
          amount_cents: number
          case_id: string
          created_at?: string
          id?: string
          payment_reference: string
          test_account: boolean
        }
        Update: {
          amount_cents?: number
          case_id?: string
          created_at?: string
          id?: string
          payment_reference?: string
          test_account?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "supplier_audit_payment_evidence_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "supplier_audit_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_audit_portal_links: {
        Row: {
          bound_by: string
          created_at: string
          evidence_reference: string
          platform_submission_id: string
          supplier_id: string
        }
        Insert: {
          bound_by: string
          created_at?: string
          evidence_reference: string
          platform_submission_id: string
          supplier_id: string
        }
        Update: {
          bound_by?: string
          created_at?: string
          evidence_reference?: string
          platform_submission_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_audit_portal_links_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: true
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_audits: {
        Row: {
          app_origin: string
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
          app_origin?: string
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
          app_origin?: string
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
      supplier_catalog_uploads: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          notes: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_by_email: string | null
          supplier_id: string
          updated_at: string
          version: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by_email?: string | null
          supplier_id: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by_email?: string | null
          supplier_id?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_catalog_uploads_supplier_id_fkey"
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
      supplier_portal_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          reference_id: string | null
          reference_table: string | null
          supplier_id: string
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          reference_id?: string | null
          reference_table?: string | null
          supplier_id: string
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          reference_id?: string | null
          reference_table?: string | null
          supplier_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_portal_notifications_supplier_id_fkey"
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
      supplier_restock_orders: {
        Row: {
          acknowledged_at: string | null
          buyer_boutique_id: string | null
          buyer_merchant_id: string | null
          catalog_id: string | null
          created_at: string
          created_by: string | null
          customization_notes: string | null
          destination_id: string | null
          destination_name: string
          destination_type: string
          due_date: string | null
          id: string
          priority: string
          product_name: string
          quantity: number
          received_at: string | null
          sent_at: string | null
          source_product_id: string | null
          status: string
          supplier_id: string
          supply_quote_id: string | null
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          buyer_boutique_id?: string | null
          buyer_merchant_id?: string | null
          catalog_id?: string | null
          created_at?: string
          created_by?: string | null
          customization_notes?: string | null
          destination_id?: string | null
          destination_name: string
          destination_type: string
          due_date?: string | null
          id?: string
          priority?: string
          product_name: string
          quantity: number
          received_at?: string | null
          sent_at?: string | null
          source_product_id?: string | null
          status?: string
          supplier_id: string
          supply_quote_id?: string | null
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          buyer_boutique_id?: string | null
          buyer_merchant_id?: string | null
          catalog_id?: string | null
          created_at?: string
          created_by?: string | null
          customization_notes?: string | null
          destination_id?: string | null
          destination_name?: string
          destination_type?: string
          due_date?: string | null
          id?: string
          priority?: string
          product_name?: string
          quantity?: number
          received_at?: string | null
          sent_at?: string | null
          source_product_id?: string | null
          status?: string
          supplier_id?: string
          supply_quote_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_restock_orders_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_restock_orders_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_restock_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_restock_orders_supply_quote_id_fkey"
            columns: ["supply_quote_id"]
            isOneToOne: false
            referencedRelation: "merchant_supply_quotes"
            referencedColumns: ["id"]
          },
        ]
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
          platform_id: string | null
          platform_synced_at: string | null
          quality_score: number | null
          risk_score: number | null
          status: string
          test_account: boolean
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
          platform_id?: string | null
          platform_synced_at?: string | null
          quality_score?: number | null
          risk_score?: number | null
          status?: string
          test_account?: boolean
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
          platform_id?: string | null
          platform_synced_at?: string | null
          quality_score?: number | null
          risk_score?: number | null
          status?: string
          test_account?: boolean
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: []
      }
      supply_operator_configuration: {
        Row: {
          enabled: boolean
          evidence_reference: string | null
          party: Json | null
          singleton: boolean
        }
        Insert: {
          enabled?: boolean
          evidence_reference?: string | null
          party?: Json | null
          singleton?: boolean
        }
        Update: {
          enabled?: boolean
          evidence_reference?: string | null
          party?: Json | null
          singleton?: boolean
        }
        Relationships: []
      }
      support_ticket_notes: {
        Row: {
          actor_id: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          actor_id?: string
          body: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          actor_id?: string
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_notes_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          category: string | null
          change_note: string | null
          closed_at: string | null
          created_at: string | null
          created_by: string | null
          creation_key: string | null
          creation_request: Json | null
          description: string
          id: string
          platform_id: string | null
          platform_synced_at: string | null
          priority: string | null
          resolution: string | null
          resolved_at: string | null
          revision: number
          status: string | null
          subject: string
          test_account: boolean
          updated_at: string | null
          user_account_id: string | null
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          category?: string | null
          change_note?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          creation_key?: string | null
          creation_request?: Json | null
          description: string
          id?: string
          platform_id?: string | null
          platform_synced_at?: string | null
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          revision?: number
          status?: string | null
          subject: string
          test_account?: boolean
          updated_at?: string | null
          user_account_id?: string | null
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          category?: string | null
          change_note?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          creation_key?: string | null
          creation_request?: Json | null
          description?: string
          id?: string
          platform_id?: string | null
          platform_synced_at?: string | null
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          revision?: number
          status?: string | null
          subject?: string
          test_account?: boolean
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tech_backlog: {
        Row: {
          app_origin: string
          assignee: string | null
          complexity: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          impact: string | null
          labels: string[] | null
          origin_request_id: string | null
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          app_origin?: string
          assignee?: string | null
          complexity?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          impact?: string | null
          labels?: string[] | null
          origin_request_id?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          app_origin?: string
          assignee?: string | null
          complexity?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          impact?: string | null
          labels?: string[] | null
          origin_request_id?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_backlog_origin_request_id_fkey"
            columns: ["origin_request_id"]
            isOneToOne: false
            referencedRelation: "publication_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_request_comments: {
        Row: {
          author_id: string | null
          author_name: string | null
          author_pole: string | null
          body: string
          created_at: string
          id: string
          request_id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          author_pole?: string | null
          body: string
          created_at?: string
          id?: string
          request_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          author_pole?: string | null
          body?: string
          created_at?: string
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tech_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_request_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          request_id: string
          to_status: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          request_id: string
          to_status?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          request_id?: string
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tech_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tech_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_requests: {
        Row: {
          assignee_id: string | null
          category: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          description: string
          id: string
          priority: string
          reference: string
          requester_id: string | null
          requester_name: string | null
          requester_pole: string
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          category?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          description: string
          id?: string
          priority?: string
          reference?: string
          requester_id?: string | null
          requester_name?: string | null
          requester_pole: string
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          category?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          description?: string
          id?: string
          priority?: string
          reference?: string
          requester_id?: string | null
          requester_name?: string | null
          requester_pole?: string
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
          platform_id: string | null
          platform_synced_at: string | null
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
          platform_id?: string | null
          platform_synced_at?: string | null
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
          platform_id?: string | null
          platform_synced_at?: string | null
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
          intake_hash: string | null
          intake_key: string | null
          report_mode: string
          resolution_notes: string | null
          revision: number
          severity: string | null
          status: Database["public"]["Enums"]["whistleblower_status"] | null
          submission_code: string
          test_account: boolean
          updated_at: string | null
        }
        Insert: {
          assigned_auditor_id?: string | null
          category: string
          created_at?: string | null
          encrypted_content: string
          id?: string
          intake_hash?: string | null
          intake_key?: string | null
          report_mode?: string
          resolution_notes?: string | null
          revision?: number
          severity?: string | null
          status?: Database["public"]["Enums"]["whistleblower_status"] | null
          submission_code: string
          test_account?: boolean
          updated_at?: string | null
        }
        Update: {
          assigned_auditor_id?: string | null
          category?: string
          created_at?: string | null
          encrypted_content?: string
          id?: string
          intake_hash?: string | null
          intake_key?: string | null
          report_mode?: string
          resolution_notes?: string | null
          revision?: number
          severity?: string | null
          status?: Database["public"]["Enums"]["whistleblower_status"] | null
          submission_code?: string
          test_account?: boolean
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
      work_escalations: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          change_note: string | null
          created_at: string
          creation_key: string | null
          creation_request: Json | null
          description: string | null
          id: string
          pole: string | null
          raised_by: string | null
          resolution_note: string | null
          resolved_at: string | null
          revision: number
          severity: string
          status: string
          test_account: boolean
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          change_note?: string | null
          created_at?: string
          creation_key?: string | null
          creation_request?: Json | null
          description?: string | null
          id?: string
          pole?: string | null
          raised_by?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          revision?: number
          severity?: string
          status?: string
          test_account?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          change_note?: string | null
          created_at?: string
          creation_key?: string | null
          creation_request?: Json | null
          description?: string | null
          id?: string
          pole?: string | null
          raised_by?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          revision?: number
          severity?: string
          status?: string
          test_account?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_escalations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_module_events: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          kind: string
          note: string | null
          record_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          record_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_module_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_processes: {
        Row: {
          archived_at: string | null
          change_note: string | null
          created_at: string
          created_by: string | null
          creation_key: string | null
          creation_request: Json | null
          description: string | null
          id: string
          name: string
          owner_id: string | null
          pole: string | null
          revision: number
          status: string
          steps: Json
          test_account: boolean
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          change_note?: string | null
          created_at?: string
          created_by?: string | null
          creation_key?: string | null
          creation_request?: Json | null
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          pole?: string | null
          revision?: number
          status?: string
          steps?: Json
          test_account?: boolean
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          change_note?: string | null
          created_at?: string
          created_by?: string | null
          creation_key?: string | null
          creation_request?: Json | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          pole?: string | null
          revision?: number
          status?: string
          steps?: Json
          test_account?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_processes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_projects: {
        Row: {
          archived_at: string | null
          change_note: string | null
          created_at: string
          created_by: string | null
          creation_key: string | null
          creation_request: Json | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          owner_id: string | null
          pole: string | null
          priority: string
          revision: number
          status: string
          test_account: boolean
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          change_note?: string | null
          created_at?: string
          created_by?: string | null
          creation_key?: string | null
          creation_request?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          owner_id?: string | null
          pole?: string | null
          priority?: string
          revision?: number
          status?: string
          test_account?: boolean
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          change_note?: string | null
          created_at?: string
          created_by?: string | null
          creation_key?: string | null
          creation_request?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          pole?: string | null
          priority?: string
          revision?: number
          status?: string
          test_account?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_task_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "work_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      work_task_history: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_task_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "work_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      work_tasks: {
        Row: {
          archived_at: string | null
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          objective: string | null
          pole: string | null
          priority: string
          status: string
          task_poles: string[]
          test_account: boolean
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          objective?: string | null
          pole?: string | null
          priority?: string
          status?: string
          task_poles?: string[]
          test_account?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          objective?: string | null
          pole?: string | null
          priority?: string
          status?: string
          task_poles?: string[]
          test_account?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_validations: {
        Row: {
          archived_at: string | null
          change_note: string | null
          created_at: string
          creation_key: string | null
          creation_request: Json | null
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          description: string | null
          id: string
          pole: string | null
          requester_id: string | null
          revision: number
          status: string
          test_account: boolean
          title: string
          updated_at: string
          validator_id: string | null
        }
        Insert: {
          archived_at?: string | null
          change_note?: string | null
          created_at?: string
          creation_key?: string | null
          creation_request?: Json | null
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          description?: string | null
          id?: string
          pole?: string | null
          requester_id?: string | null
          revision?: number
          status?: string
          test_account?: boolean
          title: string
          updated_at?: string
          validator_id?: string | null
        }
        Update: {
          archived_at?: string | null
          change_note?: string | null
          created_at?: string
          creation_key?: string | null
          creation_request?: Json | null
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          description?: string | null
          id?: string
          pole?: string | null
          requester_id?: string | null
          revision?: number
          status?: string
          test_account?: boolean
          title?: string
          updated_at?: string
          validator_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_validations_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_validations_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acknowledge_legal_governance_delivery: {
        Args: { p_id: string; p_sequence: number }
        Returns: undefined
      }
      acknowledge_sav_escalation: {
        Args: { p_issue_id: string }
        Returns: Json
      }
      add_ops_anomaly_comment: {
        Args: { p_id: string; p_message: string }
        Returns: string
      }
      add_quality_comment: {
        Args: { p_body: string; p_id: string; p_page: string }
        Returns: string
      }
      add_support_ticket_note: {
        Args: { p_body: string; p_id: string }
        Returns: string
      }
      advance_legal_governance_record: {
        Args: {
          p_action: string
          p_id: string
          p_key: string
          p_payload?: Json
          p_revision: number
        }
        Returns: Json
      }
      advance_merchant_supply_quote: {
        Args: {
          p_action: string
          p_id: string
          p_key: string
          p_payload?: Json
          p_revision: number
        }
        Returns: Json
      }
      advance_supplier_audit_case: {
        Args: {
          p_action: string
          p_id: string
          p_key: string
          p_payload?: Json
          p_revision: number
        }
        Returns: Json
      }
      apply_hr_employee_mutation: {
        Args: { p_request_id: string }
        Returns: Json
      }
      approve_catalog_acquisition_price: {
        Args: { p_id: string }
        Returns: undefined
      }
      archive_support_ticket: {
        Args: { p_id: string; p_revision: number }
        Returns: Json
      }
      assign_validated_supplier_dossier: {
        Args: {
          p_employee_id?: string
          p_portfolio_id?: string
          p_reason?: string
          p_supplier_id: string
        }
        Returns: undefined
      }
      attest_supplier_audit_bank_receipt: {
        Args: {
          p_amount_cents: number
          p_bank_statement_reference: string
          p_bank_transaction_reference: string
          p_case_id: string
          p_credited_on: string
        }
        Returns: string
      }
      audit_mission_action: { Args: { p_action: string }; Returns: boolean }
      audit_mission_action_for: {
        Args: { p_action: string; p_actor: string }
        Returns: boolean
      }
      bib_add_sourcing_candidate: {
        Args: {
          p_contact_reference?: string
          p_mission: string
          p_name: string
          p_offer: string
        }
        Returns: string
      }
      bib_advance_partner_onboarding: {
        Args: {
          p_evidence_reference: string
          p_expected_stage: string
          p_kind: string
          p_next_stage: string
          p_notes?: string
          p_platform_submission_id?: string
          p_source_id: string
        }
        Returns: string
      }
      bib_assign_case_entity: {
        Args: {
          p_entity_id: string
          p_kind: string
          p_portfolio_id: string
          p_reason?: string
        }
        Returns: undefined
      }
      bib_change_case_portfolio_owner: {
        Args: { p_new_owner: string; p_portfolio_id: string; p_reason?: string }
        Returns: undefined
      }
      bib_convert_sourcing_to_supplier_application: {
        Args: { p_candidate: string; p_email: string; p_evidence: string }
        Returns: string
      }
      bib_create_case_portfolio: {
        Args: { p_name: string; p_owner_id?: string; p_pole: string }
        Returns: string
      }
      bib_create_sourcing_mission: {
        Args: {
          p_due_date?: string
          p_merchant_id?: string
          p_merchant_reference?: string
          p_pole: string
          p_priority: string
          p_purpose: string
          p_requirements: string
          p_title: string
        }
        Returns: string
      }
      bib_data_domain_allowed: {
        Args: { p_pole: string; p_subsidiary?: string }
        Returns: boolean
      }
      bib_dispatch_due_sourcing_notifications: {
        Args: { p_now?: string }
        Returns: number
      }
      bib_fiscal_body: {
        Args: { p_id: string; p_replacement?: Json; p_test: boolean }
        Returns: Json
      }
      bib_partner_onboarding_permitted: {
        Args: { p_action: string; p_kind: string }
        Returns: boolean
      }
      bib_pilot_logistics_assignment_allowed: {
        Args: { p_submission: string }
        Returns: boolean
      }
      bib_portfolio_permission: {
        Args: { p_action: string; p_pole: string }
        Returns: boolean
      }
      bib_record_partner_catalog_eligibility: {
        Args: {
          p_audit_reference?: string
          p_case_id: string
          p_certifications: Json
          p_description: string
          p_documentary: Json
          p_sku: string
          p_status: string
        }
        Returns: string
      }
      bib_record_sourcing_followup: {
        Args: {
          p_candidate: string
          p_due_at: string
          p_note: string
          p_outcome: string
        }
        Returns: string
      }
      bib_set_pilot_partner_selection: {
        Args: {
          p_action: string
          p_kind: string
          p_partner_id: string
          p_platform_submission_id?: string
          p_reference?: string
          p_wave: number
        }
        Returns: string
      }
      bib_set_sourcing_offer_metrics: {
        Args: {
          p_candidate: string
          p_coverage: string
          p_currency: string
          p_lead_days: number
          p_moq: number
          p_price: number
          p_sla_percent: number
        }
        Returns: string
      }
      bib_sourcing_allowed: { Args: { p_pole: string }; Returns: boolean }
      bib_update_sourcing_review: {
        Args: {
          p_candidate: string
          p_comparison_notes: string
          p_evidence_reference?: string
          p_status: string
        }
        Returns: string
      }
      bind_supplier_audit_portal: {
        Args: {
          p_evidence_reference: string
          p_submission_id: string
          p_supplier_id: string
        }
        Returns: undefined
      }
      calculate_catalog_acquisition_price: {
        Args: { p: Json }
        Returns: number
      }
      calculate_demand_forecast: { Args: never; Returns: number }
      calculate_supplier_audit_quote: { Args: { p: Json }; Returns: Json }
      calculate_supply_quote: { Args: { p: Json }; Returns: Json }
      can_access_anomalies: { Args: { _uid: string }; Returns: boolean }
      can_access_finance: { Args: { _uid: string }; Returns: boolean }
      can_access_product_customization: {
        Args: { p_product_id: string; p_user_id?: string }
        Returns: boolean
      }
      can_access_rh_profiles: { Args: { _uid: string }; Returns: boolean }
      can_hr_employee_mutation_action: {
        Args: { p_action: string }
        Returns: boolean
      }
      can_hr_publication_action: {
        Args: { p_action: string }
        Returns: boolean
      }
      can_intranet_action: {
        Args: { p_action: string; p_page: string }
        Returns: boolean
      }
      can_intranet_action_for: {
        Args: { p_action: string; p_actor: string; p_page: string }
        Returns: boolean
      }
      can_intranet_table_action: {
        Args: { p_action: string; p_table: string }
        Returns: boolean
      }
      can_manage_product_customization: {
        Args: { p_product_id: string; p_user_id?: string }
        Returns: boolean
      }
      can_read_intranet_business_history: {
        Args: {
          p_actor: string
          p_id: string
          p_table: string
          p_test: boolean
        }
        Returns: boolean
      }
      can_read_intranet_drive_document: {
        Args: {
          p: Database["public"]["Tables"]["intranet_drive_documents"]["Row"]
        }
        Returns: boolean
      }
      can_read_intranet_outbox: {
        Args: { r: Database["public"]["Tables"]["intranet_outbox"]["Row"] }
        Returns: boolean
      }
      can_read_intranet_record: {
        Args: { p: Database["public"]["Tables"]["intranet_records"]["Row"] }
        Returns: boolean
      }
      can_read_ops_anomaly: {
        Args: { a: Database["public"]["Tables"]["anomalies"]["Row"] }
        Returns: boolean
      }
      can_read_quality_alert: {
        Args: { a: Database["public"]["Tables"]["quality_alerts"]["Row"] }
        Returns: boolean
      }
      can_read_released_hr_publication: {
        Args: {
          p_archive_at: string
          p_available_at: string
          p_publish_at: string
          p_scope: string
          p_status: string
          p_targets: string[]
        }
        Returns: boolean
      }
      can_read_work_module_record: {
        Args: { p_id: string; p_kind: string }
        Returns: boolean
      }
      can_review_intranet_ethics: {
        Args: { p_action: string }
        Returns: boolean
      }
      can_work_task_action: { Args: { p_action: string }; Returns: boolean }
      claim_intranet_delivery: {
        Args: { p_key: string; p_message: string }
        Returns: string
      }
      close_sav_escalation: {
        Args: { p_issue_id: string; p_note: string }
        Returns: Json
      }
      comment_compliance_dispute: {
        Args: { p_id: string; p_note: string }
        Returns: string
      }
      comment_intranet_record: {
        Args: { p_id: string; p_note: string }
        Returns: string
      }
      configure_intranet_test_identity: {
        Args: { p_actor: string; p_role: string; p_target: string }
        Returns: undefined
      }
      configure_verified_scope_dimension: {
        Args: {
          p_kind: string
          p_pole: string
          p_reason: string
          p_subsidiary: string
          p_value: string
        }
        Returns: undefined
      }
      create_audit_mission: {
        Args: { p_key: string; p_payload: Json }
        Returns: {
          anomaly_id: string | null
          app_origin: string
          assigned_at: string | null
          audit_type: string
          auditor_id: string | null
          change_note: string | null
          closed_at: string | null
          closed_by: string | null
          completed_date: string | null
          correction_evidence: string | null
          corrective_action: string | null
          corrective_due_date: string | null
          created_at: string | null
          created_by: string | null
          creation_key: string | null
          creation_request: Json | null
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          field_started_at: string | null
          findings: string | null
          id: string
          mission_reference: string | null
          recommendations: string | null
          revision: number
          scheduled_date: string | null
          score: number | null
          status: string | null
          synced_at: string | null
          target_id: string | null
          target_name: string | null
          target_type: string
          test_account: boolean
          updated_at: string | null
          workflow_status: string
        }
        SetofOptions: {
          from: "*"
          to: "field_audits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_legal_governance_record: {
        Args: { p_key: string; p_kind: string; p_payload: Json }
        Returns: Json
      }
      create_merchant_supply_quote: {
        Args: { p_key: string; p_payload: Json; p_request_id?: string }
        Returns: Json
      }
      create_merchant_supply_request: {
        Args: {
          p_boutique_id: string
          p_buyer_entity_id: string
          p_environment: string
          p_key: string
          p_merchant_id: string
          p_payload: Json
        }
        Returns: Json
      }
      create_ops_anomaly: {
        Args: { p_key: string; p_payload: Json }
        Returns: Json
      }
      create_quality_alert: {
        Args: { p_key: string; p_page: string; p_payload: Json }
        Returns: Json
      }
      create_supplier_audit_case: {
        Args: {
          p_incident_reference?: string
          p_key: string
          p_kind: string
          p_scope: string[]
          p_supplier_id: string
        }
        Returns: Json
      }
      create_support_ticket: {
        Args: { p_key: string; p_payload: Json }
        Returns: Json
      }
      create_work_module_record: {
        Args: { p_key: string; p_kind: string; p_payload: Json }
        Returns: Json
      }
      decide_intranet_external_share: {
        Args: { p_approve: boolean; p_id: string; p_note?: string }
        Returns: undefined
      }
      decide_intranet_outbox: {
        Args: { p_approve: boolean; p_id: string; p_note?: string }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      detect_replenishment_needs: { Args: never; Returns: number }
      email_queue_dispatch: { Args: never; Returns: undefined }
      employee_access_directory: {
        Args: never
        Returns: {
          email: string
          first_name: string
          hr_status: string
          id: string
          last_name: string
          last_sign_in_at: string
          poles: string[]
          position: string
          roles: string[]
        }[]
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      enqueue_intranet_email: {
        Args: { p_key: string; p_payload: Json }
        Returns: Json
      }
      enqueue_ops_anomaly_notification: {
        Args: {
          _a: Database["public"]["Tables"]["anomalies"]["Row"]
          _kind: string
          _msg: string
        }
        Returns: boolean
      }
      export_legal_governance_record: { Args: { p_id: string }; Returns: Json }
      fail_intranet_document_job: {
        Args: { p_job: string; p_lease: string }
        Returns: undefined
      }
      finish_intranet_document_job: {
        Args: {
          p_classification: string
          p_job: string
          p_lease: string
          p_mime: string
          p_name: string
          p_size: number
          p_url?: string
        }
        Returns: Json
      }
      finish_intranet_external_share: {
        Args: { p_file: string; p_id: string }
        Returns: undefined
      }
      get_approved_intranet_share: { Args: { p_id: string }; Returns: Json }
      get_catalog_acquisition_price: {
        Args: { p_product_id: string }
        Returns: Json
      }
      get_catalog_acquisition_publication:
        | { Args: { p_product_id: string }; Returns: Json }
        | {
            Args: { p_product_id: string; p_test_account: boolean }
            Returns: Json
          }
      get_compliance_dispute: { Args: { p_id: string }; Returns: Json }
      get_compliance_dispute_stats: { Args: never; Returns: Json }
      get_hr_onboarding_permissions: { Args: never; Returns: Json }
      get_hr_publication_permissions: { Args: never; Returns: Json }
      get_intranet_document_access: { Args: { p_id: string }; Returns: Json }
      get_intranet_outbox_for_dispatch: {
        Args: { p_id: string }
        Returns: Json
      }
      get_intranet_permissions: { Args: never; Returns: Json }
      get_intranet_record: { Args: { p_id: string }; Returns: Json }
      get_ops_anomaly: { Args: { p_id: string }; Returns: Json }
      get_ops_anomaly_stats: { Args: { p_page?: string }; Returns: Json }
      get_quality_alert: {
        Args: { p_id: string; p_page: string }
        Returns: Json
      }
      get_quality_stats: {
        Args: { p_kind?: string; p_page: string }
        Returns: Json
      }
      get_supplier_reference_admission: {
        Args: {
          p_reference: string
          p_supplier_id: string
          p_test_account?: boolean
        }
        Returns: boolean
      }
      get_support_ticket_stats: { Args: never; Returns: Json }
      get_work_task_permissions: { Args: never; Returns: Json }
      has_any_pole: {
        Args: { _poles: string[]; _user_id: string }
        Returns: boolean
      }
      has_pole: { Args: { _pole: string; _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hr_account_email_exists: { Args: { p_email: string }; Returns: boolean }
      hr_employee_mutation_state: {
        Args: { p_role_key: string; p_user: string }
        Returns: Json
      }
      hr_mutation_legacy_position: { Args: { p_key: string }; Returns: string }
      intranet_is_test_mode: { Args: never; Returns: boolean }
      intranet_known_legacy_position: {
        Args: { p_position: string }
        Returns: boolean
      }
      intranet_module_summary: { Args: { p_scope: string }; Returns: Json }
      intranet_poles_match: {
        Args: { p_poles: string[]; p_requested: string }
        Returns: boolean
      }
      is_canonical_bib_ceo: { Args: { p_actor: string }; Returns: boolean }
      is_intranet_actor: { Args: never; Returns: boolean }
      is_intranet_document_recipient: {
        Args: { p_id: string }
        Returns: boolean
      }
      is_intranet_staff: { Args: { _uid: string }; Returns: boolean }
      is_leadership: { Args: { _user_id: string }; Returns: boolean }
      is_rbac_catalog_admin: { Args: { p_user_id: string }; Returns: boolean }
      legacy_hr_publication_role: {
        Args: { p_poles: string[]; p_position: string }
        Returns: string
      }
      legal_required_text: { Args: { k: string; p: Json }; Returns: string }
      list_audit_people: {
        Args: never
        Returns: {
          email: string
          first_name: string
          id: string
          last_name: string
        }[]
      }
      list_bib_fiscal_events: { Args: { p_record_id: string }; Returns: Json }
      list_bib_fiscal_records: { Args: never; Returns: Json }
      list_compliance_dispute_events: {
        Args: { p_id: string; p_offset?: number }
        Returns: Json
      }
      list_compliance_dispute_people: { Args: never; Returns: Json }
      list_compliance_disputes: {
        Args: {
          p_offset?: number
          p_search?: string
          p_stage?: string
          p_status?: string
        }
        Returns: Json
      }
      list_hr_mutation_targets: { Args: { p_search?: string }; Returns: Json }
      list_hr_publications: {
        Args: never
        Returns: {
          app_origin: string
          archive_at: string | null
          author_id: string | null
          author_pole: string | null
          available_at: string | null
          body: string | null
          created_at: string
          id: string
          metadata: Json | null
          publish_at: string | null
          related_kpi_id: string | null
          status: string
          subtype: string | null
          summary: string | null
          title: string
          type: string
          updated_at: string
          version: string
          visibility_scope: string
          visibility_targets: string[]
        }[]
        SetofOptions: {
          from: "*"
          to: "publications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_intranet_business_history: {
        Args: { p_page: string }
        Returns: Json
      }
      list_intranet_document_events: { Args: never; Returns: Json }
      list_intranet_documents: {
        Args: { p_page?: string; p_search?: string }
        Returns: Json
      }
      list_intranet_ethics: { Args: { p_status?: string }; Returns: Json }
      list_intranet_ethics_events: { Args: { p_id: string }; Returns: Json }
      list_intranet_external_shares: { Args: never; Returns: Json }
      list_intranet_outbox: { Args: never; Returns: Json }
      list_intranet_outbox_events: { Args: { p_id: string }; Returns: Json }
      list_intranet_people: { Args: never; Returns: Json }
      list_intranet_record_events: { Args: { p_id: string }; Returns: Json }
      list_intranet_records: {
        Args: {
          p_offset?: number
          p_page: string
          p_search?: string
          p_status?: string
        }
        Returns: Json
      }
      list_ops_anomalies: {
        Args: {
          p_offset?: number
          p_search?: string
          p_source?: string
          p_status?: string
          p_team?: string
          p_view?: string
        }
        Returns: Json
      }
      list_ops_anomaly_events: {
        Args: { p_id: string; p_offset?: number }
        Returns: Json
      }
      list_ops_anomaly_notifications: {
        Args: { p_id?: string; p_offset?: number }
        Returns: Json
      }
      list_ops_anomaly_people: { Args: never; Returns: Json }
      list_pole_collaborators: {
        Args: { p_action?: string; p_page: string; p_pole: string }
        Returns: Json
      }
      list_quality_alerts: {
        Args: {
          p_kind?: string
          p_offset?: number
          p_page: string
          p_search?: string
          p_status?: string
        }
        Returns: Json
      }
      list_quality_people: { Args: { p_page: string }; Returns: Json }
      list_quality_timeline: {
        Args: { p_id: string; p_offset?: number; p_page: string }
        Returns: Json
      }
      list_supplier_audit_portal: {
        Args: { p_submission_id: string }
        Returns: Json
      }
      list_support_assignees: { Args: never; Returns: Json }
      list_support_ticket_history: {
        Args: { p_id: string; p_offset?: number }
        Returns: Json
      }
      list_support_ticket_notes: {
        Args: { p_id: string; p_offset?: number }
        Returns: Json
      }
      list_work_activity: {
        Args: { p_kind?: string; p_offset?: number; p_search?: string }
        Returns: Json
      }
      list_work_module_events: {
        Args: { p_id: string; p_kind: string }
        Returns: Json
      }
      list_work_module_people: { Args: { p_kind: string }; Returns: Json }
      list_work_pole_members: {
        Args: { p_kind: string; p_pole?: string }
        Returns: Json
      }
      mark_intranet_delivery_sent: {
        Args: { p_key: string; p_message: string; p_provider: string }
        Returns: undefined
      }
      mark_intranet_outbox_queued: {
        Args: { p_id: string }
        Returns: undefined
      }
      marketplace_assign_merchant: {
        Args: {
          p_merchant_id: string
          p_portfolio_id: string
          p_reason?: string
        }
        Returns: undefined
      }
      marketplace_change_portfolio_owner: {
        Args: { p_new_owner: string; p_portfolio_id: string; p_reason?: string }
        Returns: undefined
      }
      marketplace_create_portfolio: {
        Args: { p_name: string; p_notes?: string; p_owner_id?: string }
        Returns: string
      }
      merchant_supply_portal: {
        Args: {
          p_action: string
          p_boutique_id: string
          p_buyer_entity_id: string
          p_environment: string
          p_merchant_id: string
          p_payload?: Json
          p_quote_id?: string
        }
        Returns: Json
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      my_hr_professional_details: { Args: never; Returns: Json }
      my_poles: { Args: never; Returns: string[] }
      notify_anomaly: {
        Args: {
          _a: Database["public"]["Tables"]["anomalies"]["Row"]
          _kind: string
          _msg: string
        }
        Returns: undefined
      }
      product_comment_record: {
        Args: { p_id: string; p_note: string }
        Returns: string
      }
      product_get_record: { Args: { p_id: string }; Returns: Json }
      product_list_records: {
        Args: {
          p_offset?: number
          p_page: string
          p_search?: string
          p_status?: string
        }
        Returns: Json
      }
      product_module_summary: { Args: { p_scope: string }; Returns: Json }
      product_people: { Args: never; Returns: Json }
      product_record_events: { Args: { p_id: string }; Returns: Json }
      product_record_visible: {
        Args: { p_author: string; p_owner: string; p_visibility: string }
        Returns: boolean
      }
      product_save_record: {
        Args: {
          p_documents: string[]
          p_due: string
          p_expected_revision: number
          p_id: string
          p_key: string
          p_owner: string
          p_page: string
          p_payload: Json
          p_priority: string
          p_title: string
          p_visibility: string
        }
        Returns: Json
      }
      product_transition_record: {
        Args: {
          p_expected_revision: number
          p_id: string
          p_note: string
          p_status: string
        }
        Returns: Json
      }
      product_work_member: { Args: never; Returns: boolean }
      propose_catalog_acquisition_price: {
        Args: {
          p_evidence_reference: string
          p_price: Json
          p_product_id: string
        }
        Returns: string
      }
      quality_action: { Args: { p_action: string }; Returns: boolean }
      quality_action_for: {
        Args: { p_action: string; p_actor: string }
        Returns: boolean
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      read_intranet_ethics: { Args: { p_id: string }; Returns: Json }
      receive_merchant_supply_settlement: {
        Args: { p_environment: string; p_evidence: Json; p_quote_id: string }
        Returns: string
      }
      record_supplier_audit_document_manifest: {
        Args: {
          p_case_id: string
          p_document_reference: string
          p_kind: string
          p_sha256_hex: string
          p_version_label: string
        }
        Returns: string
      }
      release_rejected_intranet_delivery: {
        Args: { p_key: string; p_message: string; p_status: number }
        Returns: undefined
      }
      replace_access_permission_changes: {
        Args: { p_changes: Json; p_reason: string; p_role_id: string }
        Returns: undefined
      }
      replace_access_role_scopes: {
        Args: {
          p_expected: Json
          p_next: Json
          p_reason: string
          p_role_id: string
        }
        Returns: undefined
      }
      replace_platform_favorites: {
        Args: { p_rows: Json; p_snapshot_at: string }
        Returns: number
      }
      request_intranet_external_share: {
        Args: { p_document: string; p_reason: string; p_recipient: string }
        Returns: string
      }
      reserve_hr_onboarding_invitation: {
        Args: { p_attempt_nonce: string; p_request_id: string }
        Returns: boolean
      }
      reserve_intranet_document_job: {
        Args: {
          p_hash: string
          p_key: string
          p_kind: string
          p_metadata: Json
          p_page: string
        }
        Returns: Json
      }
      rh_can_assign_employee_portfolio: {
        Args: { p_employee_id: string; p_portfolio_id: string }
        Returns: boolean
      }
      run_reconciliation: { Args: never; Returns: number }
      save_bib_fiscal_record: {
        Args: { p_expected_revision: number; p_record: Json }
        Returns: Json
      }
      save_catalog_customization: {
        Args: { p_capabilities: Json; p_product_id: string; p_terms: Json }
        Returns: Json
      }
      save_compliance_dispute: {
        Args: {
          p_documents?: string[]
          p_due: string
          p_id: string
          p_key: string
          p_owner: string
          p_payload: Json
          p_priority: string
          p_revision: number
          p_title: string
          p_visibility: string
        }
        Returns: Json
      }
      save_hierarchical_scope_policy_draft: {
        Args: { p_policy: Json; p_reason: string; p_role_id: string }
        Returns: undefined
      }
      save_hr_publication: {
        Args: {
          p_body: string
          p_creation_key: string
          p_expected_updated_at: string
          p_id: string
          p_poles: string[]
          p_status: string
          p_subtype: string
          p_summary: string
          p_title: string
          p_visibility: string
        }
        Returns: Json
      }
      save_intranet_record: {
        Args: {
          p_documents?: string[]
          p_due: string
          p_expected_revision: number
          p_id: string
          p_key: string
          p_owner: string
          p_page: string
          p_payload: Json
          p_priority: string
          p_title: string
          p_visibility: string
        }
        Returns: Json
      }
      save_product_release_tracking: {
        Args: {
          p_app_key: string
          p_change_reference: string
          p_environment: string
          p_id: string
          p_note: string
          p_request_id: string
          p_rollback_reference: string
          p_security_reference: string
          p_status: string
          p_test_reference: string
          p_version: string
        }
        Returns: string
      }
      send_anomaly_reminders: { Args: never; Returns: number }
      set_hr_employee_mutation_status: {
        Args: { p_note?: string; p_request_id: string; p_status: string }
        Returns: Json
      }
      set_intranet_document_job_ids: {
        Args: {
          p_file: string
          p_job: string
          p_lease: string
          p_shortcut?: string
        }
        Returns: undefined
      }
      store_intranet_ethics_report: {
        Args: {
          p_category: string
          p_ciphertext: string
          p_hash: string
          p_key: string
          p_mode: string
          p_severity: string
          p_test: boolean
        }
        Returns: Json
      }
      submit_hr_employee_mutation: {
        Args: {
          p_creation_key: string
          p_expected_target_revision: string
          p_payload: Json
          p_replace_assignment_ids: string[]
          p_target_user_id: string
        }
        Returns: Json
      }
      submit_intranet_outbox: {
        Args: {
          p_body: string
          p_key: string
          p_recipients: string[]
          p_source: string
          p_subject: string
        }
        Returns: Json
      }
      supplier_audit_require_text: {
        Args: { k: string; p: Json }
        Returns: string
      }
      supply_buyer_identity: {
        Args: { p_boutique_id: string; p_merchant_id: string; p_test: boolean }
        Returns: Json
      }
      supply_quote_eligible: {
        Args: {
          q: Database["public"]["Tables"]["merchant_supply_quotes"]["Row"]
        }
        Returns: boolean
      }
      supply_quote_options: { Args: never; Returns: Json }
      supply_restock_in_mode: { Args: { p_quote_id: string }; Returns: boolean }
      supply_text: {
        Args: { k: string; max_length?: number; p: Json }
        Returns: string
      }
      supply_timestamp: { Args: { value: string }; Returns: string }
      transition_compliance_dispute: {
        Args: {
          p_action: string
          p_id: string
          p_note: string
          p_revision: number
        }
        Returns: Json
      }
      transition_intranet_record: {
        Args: {
          p_expected_revision: number
          p_id: string
          p_note?: string
          p_status: string
        }
        Returns: Json
      }
      transition_ops_anomaly: {
        Args: {
          p_action: string
          p_id: string
          p_note?: string
          p_revision: number
        }
        Returns: Json
      }
      transition_quality_alert: {
        Args: {
          p_action: string
          p_id: string
          p_note?: string
          p_page: string
          p_revision: number
        }
        Returns: Json
      }
      transition_work_module_record: {
        Args: {
          p_id: string
          p_kind: string
          p_note?: string
          p_revision: number
          p_status: string
        }
        Returns: Json
      }
      update_audit_mission: {
        Args: { p_id: string; p_patch: Json; p_revision: number }
        Returns: {
          anomaly_id: string | null
          app_origin: string
          assigned_at: string | null
          audit_type: string
          auditor_id: string | null
          change_note: string | null
          closed_at: string | null
          closed_by: string | null
          completed_date: string | null
          correction_evidence: string | null
          corrective_action: string | null
          corrective_due_date: string | null
          created_at: string | null
          created_by: string | null
          creation_key: string | null
          creation_request: Json | null
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          field_started_at: string | null
          findings: string | null
          id: string
          mission_reference: string | null
          recommendations: string | null
          revision: number
          scheduled_date: string | null
          score: number | null
          status: string | null
          synced_at: string | null
          target_id: string | null
          target_name: string | null
          target_type: string
          test_account: boolean
          updated_at: string | null
          workflow_status: string
        }
        SetofOptions: {
          from: "*"
          to: "field_audits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_intranet_ethics: {
        Args: {
          p_assignee: string
          p_id: string
          p_note: string
          p_revision: number
          p_status: string
        }
        Returns: undefined
      }
      update_ops_anomaly: {
        Args: { p_id: string; p_patch: Json; p_revision: number }
        Returns: Json
      }
      update_quality_alert: {
        Args: {
          p_id: string
          p_page: string
          p_patch: Json
          p_revision: number
        }
        Returns: Json
      }
      update_support_ticket: {
        Args: { p_id: string; p_patch: Json; p_revision: number }
        Returns: Json
      }
      upsert_platform_customization_request: {
        Args: { p_row: Json }
        Returns: string
      }
      upsert_platform_stock_restock_request: {
        Args: { p_row: Json }
        Returns: string
      }
      validate_customization_metadata: {
        Args: { p_caps: Json; p_details: Json; p_terms: Json }
        Returns: undefined
      }
      validate_hr_employee_mutation: {
        Args: { p_payload: Json; p_replace_ids: string[]; p_target: string }
        Returns: Json
      }
      validate_intranet_payload: {
        Args: { p_page: string; p_payload: Json }
        Returns: undefined
      }
      validate_legal_governance_payload: {
        Args: { kind: string; p: Json }
        Returns: undefined
      }
      work_module_table: { Args: { p_kind: string }; Returns: string }
      work_task_in_scope: {
        Args: {
          p_assignee: string
          p_creator: string
          p_poles: string[]
          p_test: boolean
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
        | "marketplace"
        | "support"
        | "product"
        | "data"
        | "security"
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
        "marketplace",
        "support",
        "product",
        "data",
        "security",
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
