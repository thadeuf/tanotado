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
      appointments: {
        Row: {
          client_id: string
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
        }
        Insert: {
          client_id: string
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
        }
        Update: {
          client_id?: string
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
        }
        Relationships: []
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
          instance_id: string | null // <<< ADICIONADO
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
          instance_id?: string | null // <<< ADICIONADO
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
          instance_id?: string | null // <<< ADICIONADO
        }
        Relationships: [
          // <<< RELACIONAMENTO ADICIONADO >>>
          {
            foreignKeyName: "profiles_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
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
        get_instances_with_user_count: { // <<< FUNÇÃO RPC ADICIONADA
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
      user_role: "admin" | "user"
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
    },
  },
} as const