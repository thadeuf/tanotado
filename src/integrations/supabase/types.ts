export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string
          description: string | null
          id: number
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_type: string | null
          client_id: string | null
          color: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          is_online: boolean | null
          online_url: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          price: number | null
          recurrence_end_date: string | null
          recurrence_frequency: string | null
          recurrence_group_id: string | null
          recurrence_type: Database["public"]["Enums"]["recurrence_type"] | null
          reminder_message_id: string | null
          session_type: string | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_type?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_online?: boolean | null
          online_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          price?: number | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          recurrence_group_id?: string | null
          recurrence_type?:
            | Database["public"]["Enums"]["recurrence_type"]
            | null
          reminder_message_id?: string | null
          session_type?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_online?: boolean | null
          online_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          price?: number | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          recurrence_group_id?: string | null
          recurrence_type?:
            | Database["public"]["Enums"]["recurrence_type"]
            | null
          reminder_message_id?: string | null
          session_type?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          client_id: string
          content: Json | null
          created_at: string
          id: string
          template_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          client_id: string
          content?: Json | null
          created_at?: string
          id?: string
          template_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          client_id?: string
          content?: Json | null
          created_at?: string
          id?: string
          template_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          approval_status:
            | Database["public"]["Enums"]["client_approval_status"]
            | null
          avatar_url: string | null
          billing_day: number | null
          birth_date: string | null
          cep: string | null
          cpf: string | null
          created_at: string | null
          education: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_whatsapp: string | null
          financial_responsible_cpf: string | null
          financial_responsible_email: string | null
          financial_responsible_name: string | null
          financial_responsible_rg: string | null
          financial_responsible_whatsapp: string | null
          forwarding: string | null
          gender: string | null
          group: string | null
          id: string
          is_active: boolean | null
          marital_status: string | null
          name: string
          nationality: string | null
          notes: string | null
          occupation: string | null
          professional_responsible: string | null
          rg: string | null
          send_billing_reminder: boolean | null
          send_session_reminder: boolean | null
          session_value: number | null
          status: string
          updated_at: string | null
          user_id: string
          video_call_link: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          approval_status?:
            | Database["public"]["Enums"]["client_approval_status"]
            | null
          avatar_url?: string | null
          billing_day?: number | null
          birth_date?: string | null
          cep?: string | null
          cpf?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_whatsapp?: string | null
          financial_responsible_cpf?: string | null
          financial_responsible_email?: string | null
          financial_responsible_name?: string | null
          financial_responsible_rg?: string | null
          financial_responsible_whatsapp?: string | null
          forwarding?: string | null
          gender?: string | null
          group?: string | null
          id?: string
          is_active?: boolean | null
          marital_status?: string | null
          name: string
          nationality?: string | null
          notes?: string | null
          occupation?: string | null
          professional_responsible?: string | null
          rg?: string | null
          send_billing_reminder?: boolean | null
          send_session_reminder?: boolean | null
          session_value?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
          video_call_link?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          approval_status?:
            | Database["public"]["Enums"]["client_approval_status"]
            | null
          avatar_url?: string | null
          billing_day?: number | null
          birth_date?: string | null
          cep?: string | null
          cpf?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_whatsapp?: string | null
          financial_responsible_cpf?: string | null
          financial_responsible_email?: string | null
          financial_responsible_name?: string | null
          financial_responsible_rg?: string | null
          financial_responsible_whatsapp?: string | null
          forwarding?: string | null
          gender?: string | null
          group?: string | null
          id?: string
          is_active?: boolean | null
          marital_status?: string | null
          name?: string
          nationality?: string | null
          notes?: string | null
          occupation?: string | null
          professional_responsible?: string | null
          rg?: string | null
          send_billing_reminder?: boolean | null
          send_session_reminder?: boolean | null
          session_value?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
          video_call_link?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      conversation_threads: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          phone_number: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          phone_number: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          phone_number?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_threads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      instances: {
        Row: {
          created_at: string
          id: string
          nome_instancia: string
          status: string | null
          telefone_conectado: string | null
          token: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_instancia: string
          status?: string | null
          telefone_conectado?: string | null
          token?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_instancia?: string
          status?: string | null
          telefone_conectado?: string | null
          token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          next_billing_date: string | null
          paid: boolean | null
          pdf_url: string | null
          status: string | null
          total: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id: string
          next_billing_date?: string | null
          paid?: boolean | null
          pdf_url?: string | null
          status?: string | null
          total?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          next_billing_date?: string | null
          paid?: boolean | null
          pdf_url?: string | null
          status?: string | null
          total?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          appointment_id: string | null
          client_id: string
          content: string
          created_at: string | null
          id: string
          session_date: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          content: string
          created_at?: string | null
          id?: string
          session_date: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          content?: string
          created_at?: string | null
          id?: string
          session_date?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      message_queue: {
        Row: {
          appointment_id: string | null
          client_id: string | null
          created_at: string
          error_message: string | null
          id: string
          instance_id: string
          message_body: string
          processed_at: string | null
          recipient_whatsapp: string
          reminder_type: string | null
          status: Database["public"]["Enums"]["message_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          instance_id: string
          message_body: string
          processed_at?: string | null
          recipient_whatsapp: string
          reminder_type?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          instance_id?: string
          message_body?: string
          processed_at?: string | null
          recipient_whatsapp?: string
          reminder_type?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          client_id: string
          created_at: string | null
          due_date: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          client_id: string
          created_at?: string | null
          due_date: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          client_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about_you: string | null
          address: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          appointment_label: string | null
          avatar_url: string | null
          canceled_at: string | null
          cep: string | null
          client_nomenclature: string | null
          council_registration: string | null
          cpf: string | null
          created_at: string | null
          email: string
          google_access_token: string | null
          google_refresh_token: string | null
          google_token_expires_at: string | null
          has_completed_onboarding: boolean | null
          id: string
          instance_id: string | null
          is_active: boolean | null
          is_subscribed: boolean | null
          last_sign_in_at: string | null
          login_count: number | null
          name: string
          procuracao_receita_saude_url: string | null
          public_booking_enabled: boolean | null
          public_booking_url_slug: string | null
          receita_saude_enabled: boolean | null
          recovery_code: string | null
          recovery_code_expires_at: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          specialty: string | null
          specialty_label: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_subscription_status: string | null
          subscribed_at: string | null
          subscription_current_period_end: string | null
          subscription_status: string | null
          timezone: string | null
          trial_ends_at: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          about_you?: string | null
          address?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          appointment_label?: string | null
          avatar_url?: string | null
          canceled_at?: string | null
          cep?: string | null
          client_nomenclature?: string | null
          council_registration?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          has_completed_onboarding?: boolean | null
          id: string
          instance_id?: string | null
          is_active?: boolean | null
          is_subscribed?: boolean | null
          last_sign_in_at?: string | null
          login_count?: number | null
          name: string
          procuracao_receita_saude_url?: string | null
          public_booking_enabled?: boolean | null
          public_booking_url_slug?: string | null
          receita_saude_enabled?: boolean | null
          recovery_code?: string | null
          recovery_code_expires_at?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          specialty?: string | null
          specialty_label?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_status?: string | null
          subscribed_at?: string | null
          subscription_current_period_end?: string | null
          subscription_status?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          about_you?: string | null
          address?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          appointment_label?: string | null
          avatar_url?: string | null
          canceled_at?: string | null
          cep?: string | null
          client_nomenclature?: string | null
          council_registration?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          is_subscribed?: boolean | null
          last_sign_in_at?: string | null
          login_count?: number | null
          name?: string
          procuracao_receita_saude_url?: string | null
          public_booking_enabled?: boolean | null
          public_booking_url_slug?: string | null
          receita_saude_enabled?: boolean | null
          recovery_code?: string | null
          recovery_code_expires_at?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          specialty?: string | null
          specialty_label?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_status?: string | null
          subscribed_at?: string | null
          subscription_current_period_end?: string | null
          subscription_status?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      proxy: {
        Row: {
          city_name: string | null
          country_code: string | null
          created_at: string | null
          id: number
          last_verification: string | null
          password: string | null
          port: number | null
          proxy_address: string | null
          username: string | null
          valid: boolean | null
        }
        Insert: {
          city_name?: string | null
          country_code?: string | null
          created_at?: string | null
          id: number
          last_verification?: string | null
          password?: string | null
          port?: number | null
          proxy_address?: string | null
          username?: string | null
          valid?: boolean | null
        }
        Update: {
          city_name?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: number
          last_verification?: string | null
          password?: string | null
          port?: number | null
          proxy_address?: string | null
          username?: string | null
          valid?: boolean | null
        }
        Relationships: []
      }
      recibos_ecac: {
        Row: {
          cpf_beneficiario: string | null
          cpf_pagador: string | null
          cpf_profissional: string | null
          created_at: string | null
          data_pagamento: string | null
          descricao: string | null
          id: number
          id_cliente: string | null
          id_profissional: string | null
          payment_id: string | null
          status: Database["public"]["Enums"]["recibo_status"]
          url_recibo: string | null
          valor: number | null
        }
        Insert: {
          cpf_beneficiario?: string | null
          cpf_pagador?: string | null
          cpf_profissional?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          id?: number
          id_cliente?: string | null
          id_profissional?: string | null
          payment_id?: string | null
          status?: Database["public"]["Enums"]["recibo_status"]
          url_recibo?: string | null
          valor?: number | null
        }
        Update: {
          cpf_beneficiario?: string | null
          cpf_pagador?: string | null
          cpf_profissional?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          id?: number
          id_cliente?: string | null
          id_profissional?: string | null
          payment_id?: string | null
          status?: Database["public"]["Enums"]["recibo_status"]
          url_recibo?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recibos_ecac_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recibos_ecac_id_profissional_fkey"
            columns: ["id_profissional"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recibos_ecac_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      session_notes: {
        Row: {
          appointment_id: string
          client_id: string
          content: Json | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          appointment_id: string
          client_id: string
          content?: Json | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          appointment_id?: string
          client_id?: string
          content?: Json | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          appointment_duration: number | null
          break_time: number | null
          client_groups_template: Json | null
          created_at: string | null
          email_reminders_enabled: boolean | null
          google_calendar_enabled: boolean | null
          id: string
          message_templates: Json | null
          notifications_enabled: boolean | null
          prontuario_template: Json | null
          updated_at: string | null
          user_id: string
          whatsapp_reminders_enabled: boolean | null
          working_hours: Json | null
        }
        Insert: {
          appointment_duration?: number | null
          break_time?: number | null
          client_groups_template?: Json | null
          created_at?: string | null
          email_reminders_enabled?: boolean | null
          google_calendar_enabled?: boolean | null
          id?: string
          message_templates?: Json | null
          notifications_enabled?: boolean | null
          prontuario_template?: Json | null
          updated_at?: string | null
          user_id: string
          whatsapp_reminders_enabled?: boolean | null
          working_hours?: Json | null
        }
        Update: {
          appointment_duration?: number | null
          break_time?: number | null
          client_groups_template?: Json | null
          created_at?: string | null
          email_reminders_enabled?: boolean | null
          google_calendar_enabled?: boolean | null
          id?: string
          message_templates?: Json | null
          notifications_enabled?: boolean | null
          prontuario_template?: Json | null
          updated_at?: string | null
          user_id?: string
          whatsapp_reminders_enabled?: boolean | null
          working_hours?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_user_profile: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      cpf_exists: {
        Args: { cpf_to_check: string }
        Returns: boolean
      }
      create_appointment: {
        Args:
          | {
              p_professional_id: string
              p_client_id: string
              p_appointment_date: string
              p_appointment_hour: string
            }
          | {
              p_professional_id: string
              p_client_id: string
              p_appointment_date: string
              p_appointment_hour: string
              p_title: string
            }
          | {
              p_professional_id: string
              p_client_id: string
              p_appointment_datetime: string
              p_summary: string
            }
        Returns: Json
      }
      create_public_appointment: {
        Args:
          | {
              p_client_id: string
              p_professional_id: string
              p_start_time: string
            }
          | {
              p_client_id: string
              p_professional_id: string
              p_start_time: string
              p_notes: string
            }
        Returns: string
      }
      deactivate_user_profile: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      find_or_create_pending_client: {
        Args: {
          p_cpf: string
          p_birth_date: string
          p_professional_id: string
          p_name?: string
          p_whatsapp?: string
          p_email?: string
          p_initial_consultation_reason?: string
        }
        Returns: {
          client_id: string
          client_name: string
          client_whatsapp: string
          client_email: string
          client_exists_and_active: boolean
        }[]
      }
      get_all_profiles_with_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          email: string
          whatsapp: string
          is_subscribed: boolean
          is_active: boolean
          trial_ends_at: string
          subscribed_at: string
          canceled_at: string
          last_sign_in_at: string
          login_count: number
          avatar_url: string
          stripe_subscription_id: string
          stripe_subscription_status: string
          client_count: number
          appointment_count: number
        }[]
      }
      get_available_slots: {
        Args: { p_professional_id: string; p_query_date: string }
        Returns: {
          available_slot: string
        }[]
      }
      get_available_slots_n8n: {
        Args: { p_professional_id: string; p_query_date: string }
        Returns: {
          available_slot: string
        }[]
      }
      get_billing_reminders: {
        Args: Record<PropertyKey, never>
        Returns: {
          recipient_whatsapp: string
          message_body: string
          instance_name: string
        }[]
      }
      get_client_details_with_stats: {
        Args: { p_client_id: string }
        Returns: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          name: string
          whatsapp: string
          email: string
          cpf: string
          rg: string
          birth_date: string
          address: string
          address_number: string
          address_neighborhood: string
          address_city: string
          address_state: string
          address_complement: string
          cep: string
          gender: string
          marital_status: string
          nationality: string
          education: string
          occupation: string
          notes: string
          is_active: boolean
          avatar_url: string
          professional_responsible: string
          group: string
          video_call_link: string
          session_value: number
          billing_day: number
          send_billing_reminder: boolean
          financial_responsible_name: string
          financial_responsible_whatsapp: string
          financial_responsible_email: string
          financial_responsible_cpf: string
          financial_responsible_rg: string
          emergency_contact_name: string
          emergency_contact_whatsapp: string
          forwarding: string
          send_session_reminder: boolean
          total_sessions: number
          attended_sessions: number
          missed_sessions: number
          total_due: number
        }[]
      }
      get_daily_schedules_for_messaging: {
        Args: { p_target_date?: string }
        Returns: Json
      }
      get_instances_with_user_count: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          created_at: string
          user_id: string
          nome_instancia: string
          status: string
          token: string
          telefone_conectado: string
          associated_users_count: number
        }[]
      }
      get_next_message_from_queue: {
        Args: Record<PropertyKey, never>
        Returns: {
          job_id: string
          professional_user_id: string
          instance_id: string
          recipient_whatsapp: string
          message_body: string
          job_status: Database["public"]["Enums"]["message_status"]
          error_message: string
          job_created_at: string
          processed_at: string
          appointment_id: string
          reminder_type: string
          instance_name: string
        }[]
      }
      get_pending_notes_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_professional_available_slots: {
        Args: { p_professional_id: string; p_selected_date: string }
        Returns: {
          available_slot: string
        }[]
      }
      get_professional_booked_slots: {
        Args: { p_professional_id: string; p_selected_date: string }
        Returns: {
          booked_time: string
        }[]
      }
      get_professional_by_client_phone: {
        Args: { p_whatsapp_number: string }
        Returns: {
          professional_id: string
          professional_name: string
          client_id: string
          client_name: string
          client_nomenclature: string
        }[]
      }
      get_profile_details_for_admin: {
        Args: { p_profile_id: string }
        Returns: {
          profile_id: string
          name: string
          email: string
          created_at: string
          whatsapp: string
          is_subscribed: boolean
          is_active: boolean
          cep: string
          address: string
          address_number: string
          address_neighborhood: string
          address_city: string
          address_state: string
          address_complement: string
          instance_name: string
          stripe_subscription_status: string
          subscription_current_period_end: number
        }[]
      }
      get_public_profile_by_slug: {
        Args: { p_slug: string }
        Returns: {
          id: string
          name: string
          specialty: string
          avatar_url: string
          about_you: string
          client_nomenclature: string
          working_hours: Json
          appointment_duration: number
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      migrate_random_users_between_instances: {
        Args: {
          p_source_instance_id: string
          p_destination_instance_id: string
          p_user_count: number
        }
        Returns: number
      }
      queue_session_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_message_status: {
        Args: {
          p_job_id: string
          p_new_status: Database["public"]["Enums"]["message_status"]
          p_error_message?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      client_approval_status: "pending" | "approved" | "rejected"
      message_status: "pending" | "processing" | "sent" | "failed"
      payment_status: "pending" | "paid" | "overdue" | "cancelled"
      recibo_status: "Pendente" | "Emitido"
      recurrence_type: "none" | "daily" | "weekly" | "monthly"
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      appointment_time_range: {
        start_t: string | null
        end_t: string | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : DefaultSchemaTableNameOrOptions = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : DefaultSchemaTableNameOrOptions = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : DefaultSchemaEnumNameOrOptions = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : PublicCompositeTypeNameOrOptions = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      client_approval_status: ["pending", "approved", "rejected"],
      message_status: ["pending", "processing", "sent", "failed"],
      payment_status: ["pending", "paid", "overdue", "cancelled"],
      recibo_status: ["Pendente", "Emitido"],
      recurrence_type: ["none", "daily", "weekly", "monthly"],
      user_role: ["admin", "user"],
    },
  },
} as const
