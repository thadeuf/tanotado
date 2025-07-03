// src/integrations/supabase/types.ts

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
          id: number
          key: string
          value: Json | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          key: string
          value?: Json | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          key?: string
          value?: Json | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          price: number | null
          recurrence_end_date: string | null
          recurrence_type: Database["public"]["Enums"]["recurrence_type"] | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          title: string
          updated_at: string | null
          user_id: string
          appointment_type: "appointment" | "block"
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          price?: number | null
          recurrence_end_date?: string | null
          recurrence_type?:
            | Database["public"]["Enums"]["recurrence_type"]
            | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          title: string
          updated_at?: string | null
          user_id: string
          appointment_type?: "appointment" | "block"
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          price?: number | null
          recurrence_end_date?: string | null
          recurrence_type?:
            | Database["public"]["Enums"]["recurrence_type"]
            | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          appointment_type?: "appointment" | "block"
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
      clients: {
        Row: {
          address: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
          send_session_reminder: boolean
          is_active: boolean
          approval_status: Database["public"]["Enums"]["client_approval_status"] | null;
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
          send_session_reminder?: boolean
          is_active?: boolean
          approval_status?: Database["public"]["Enums"]["client_approval_status"] | null;
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
          send_session_reminder?: boolean
          is_active?: boolean
          approval_status?: Database["public"]["Enums"]["client_approval_status"] | null;
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          id: string
          created_at: string
          user_id: string
          client_id: string
          template_id: string | null
          title: string
          content: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          client_id: string
          template_id?: string | null
          title: string
          content?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          client_id?: string
          template_id?: string | null
          title?: string
          content?: Json | null
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
          }
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
          client_nomenclature: string | null
          cpf: string | null
          created_at: string | null
          email: string
          has_completed_onboarding: boolean | null
          id: string
          is_subscribed: boolean | null
          is_active: boolean | null
          name: string
          role: Database["public"]["Enums"]["user_role"] | null
          specialty: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
          whatsapp: string | null
          subscribed_at: string | null
          canceled_at: string | null
          last_sign_in_at: string | null
          login_count: number | null
          avatar_url: string | null
          council_registration: string | null
          about_you: string | null
          cep: string | null
          address: string | null
          address_number: string | null
          address_neighborhood: string | null
          address_city: string | null
          address_state: string | null
          address_complement: string | null
          instance_id: string | null
          public_booking_url_slug: string | null
          public_booking_enabled: boolean | null
          procuracao_receita_saude_url: string | null
          receita_saude_enabled: boolean | null
          appointment_label: string | null
          specialty_label: string | null
        }
        Insert: {
          client_nomenclature?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          has_completed_onboarding?: boolean | null
          id: string
          is_subscribed?: boolean | null
          is_active?: boolean | null
          name: string
          role?: Database["public"]["Enums"]["user_role"] | null
          specialty?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          subscribed_at?: string | null
          canceled_at?: string | null
          last_sign_in_at?: string | null
          login_count?: number | null
          avatar_url?: string | null
          council_registration?: string | null
          about_you?: string | null
          cep?: string | null
          address?: string | null
          address_number?: string | null
          address_neighborhood?: string | null
          address_city?: string | null
          address_state?: string | null
          address_complement?: string | null
          instance_id?: string | null
          public_booking_url_slug?: string | null
          public_booking_enabled?: boolean | null
          procuracao_receita_saude_url?: string | null
          receita_saude_enabled?: boolean | null
          appointment_label?: string | null
          specialty_label?: string | null
        }
        Update: {
          client_nomenclature?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          has_completed_onboarding?: boolean | null
          id?: string
          is_subscribed?: boolean | null
          is_active?: boolean | null
          name?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          specialty?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          subscribed_at?: string | null
          canceled_at?: string | null
          last_sign_in_at?: string | null
          login_count?: number | null
          avatar_url?: string | null
          council_registration?: string | null
          about_you?: string | null
          cep?: string | null
          address?: string | null
          address_number?: string | null
          address_neighborhood?: string | null
          address_city?: string | null
          address_state?: string | null
          address_complement?: string | null
          instance_id?: string | null
          public_booking_url_slug?: string | null
          public_booking_enabled?: boolean | null
          procuracao_receita_saude_url?: string | null
          receita_saude_enabled?: boolean | null
          appointment_label?: string | null
          specialty_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          }
        ]
      }
      session_notes: {
        Row: {
          id: string
          created_at: string
          user_id: string
          client_id: string
          appointment_id: string
          content: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          client_id: string
          appointment_id: string
          content?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          client_id?: string
          appointment_id?: string
          content?: Json | null
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
          }
        ]
      }
      user_settings: {
        Row: {
          appointment_duration: number | null
          break_time: number | null
          created_at: string | null
          email_reminders_enabled: boolean | null
          id: string
          message_templates: Json | null
          notifications_enabled: boolean | null
          updated_at: string | null
          user_id: string
          whatsapp_reminders_enabled: boolean | null
          working_hours: Json | null
        }
        Insert: {
          appointment_duration?: number | null
          break_time?: number | null
          created_at?: string | null
          email_reminders_enabled?: boolean | null
          id?: string
          message_templates?: Json | null
          notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          whatsapp_reminders_enabled?: boolean | null
          working_hours?: Json | null
        }
        Update: {
          appointment_duration?: number | null
          break_time?: number | null
          created_at?: string | null
          email_reminders_enabled?: boolean | null
          id?: string
          message_templates?: Json | null
          notifications_enabled?: boolean | null
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
      get_all_profiles_with_counts: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          name: string;
          email: string;
          whatsapp: string;
          is_subscribed: boolean;
          is_active: boolean;
          trial_ends_at: string;
          subscribed_at: string;
          canceled_at: string;
          last_sign_in_at: string;
          login_count: number;
          client_count: number;
          appointment_count: number;
        }[];
      };
      cpf_exists: {
        Args: { cpf_to_check: string };
        Returns: boolean;
      };
      find_or_create_pending_client: {
        Args: {
          p_cpf: string;
          p_birth_date: string;
          p_professional_id: string;
          p_name?: string;
          p_whatsapp?: string;
          p_email?: string;
          p_initial_consultation_reason?: string;
        };
        Returns: {
          client_id: string;
          client_name: string;
          client_whatsapp: string;
          client_email: string;
          client_exists_and_active: boolean;
        }[];
      };
    }
    Enums: {
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      payment_status: "pending" | "paid" | "overdue" | "cancelled"
      recurrence_type: "none" | "daily" | "weekly" | "monthly"
      user_role: "admin" | "user";
      client_approval_status: "pending" | "approved" | "rejected";
    }
    CompositeTypes: {
      [_ in never]: never
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
      Database["public"]["Tables"])[TableName] extends {
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
    : never = never,
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
    : never = never,
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
    : never = never,
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
    : never = never,
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
      payment_status: ["pending", "paid", "overdue", "cancelled"],
      recurrence_type: ["none", "daily", "weekly", "monthly"],
      user_role: ["admin", "user"],
      client_approval_status: ["pending", "approved", "rejected"],
    },
  },
} as const;