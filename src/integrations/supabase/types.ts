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
          appointment_type: string | null
          client_id: string | null
          color: string | null
          create_financial_record: boolean | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          price: number | null
          recurrence_count: number | null
          recurrence_end_date: string | null
          recurrence_group_id: string | null
          recurrence_type: Database["public"]["Enums"]["recurrence_type"] | null
          session_type: string | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          title: string | null
          updated_at: string | null
          user_id: string
          video_call_link: string | null
        }
        Insert: {
          appointment_type?: string | null
          client_id?: string | null
          color?: string | null
          create_financial_record?: boolean | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          price?: number | null
          recurrence_count?: number | null
          recurrence_end_date?: string | null
          recurrence_group_id?: string | null
          recurrence_type?:
            | Database["public"]["Enums"]["recurrence_type"]
            | null
          session_type?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          video_call_link?: string | null
        }
        Update: {
          appointment_type?: string | null
          client_id?: string | null
          color?: string | null
          create_financial_record?: boolean | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          price?: number | null
          recurrence_count?: number | null
          recurrence_end_date?: string | null
          recurrence_group_id?: string | null
          recurrence_type?:
            | Database["public"]["Enums"]["recurrence_type"]
            | null
          session_type?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          video_call_link?: string | null
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
          activate_session_reminder: boolean | null
          active_registration: boolean | null
          address: string | null
          birth_date: string | null
          cep: string | null
          city: string | null
          complement: string | null
          cpf: string | null
          created_at: string | null
          default_video_call_link: string | null
          education: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_whatsapp: string | null
          financial_responsible_cpf: string | null
          financial_responsible_email: string | null
          financial_responsible_name: string | null
          financial_responsible_rg: string | null
          financial_responsible_whatsapp: string | null
          gender: string | null
          group_id: string | null
          id: string
          marital_status: string | null
          name: string
          nationality: string | null
          neighborhood: string | null
          notes: string | null
          number: string | null
          payment_day: string | null
          phone: string | null
          photo_url: string | null
          profession: string | null
          referral: string | null
          rg: string | null
          send_monthly_reminder: boolean | null
          session_value: string | null
          state: string | null
          updated_at: string | null
          user_id: string
          video_call_link: string | null
        }
        Insert: {
          activate_session_reminder?: boolean | null
          active_registration?: boolean | null
          address?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string | null
          default_video_call_link?: string | null
          education?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_whatsapp?: string | null
          financial_responsible_cpf?: string | null
          financial_responsible_email?: string | null
          financial_responsible_name?: string | null
          financial_responsible_rg?: string | null
          financial_responsible_whatsapp?: string | null
          gender?: string | null
          group_id?: string | null
          id?: string
          marital_status?: string | null
          name: string
          nationality?: string | null
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          payment_day?: string | null
          phone?: string | null
          photo_url?: string | null
          profession?: string | null
          referral?: string | null
          rg?: string | null
          send_monthly_reminder?: boolean | null
          session_value?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
          video_call_link?: string | null
        }
        Update: {
          activate_session_reminder?: boolean | null
          active_registration?: boolean | null
          address?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string | null
          default_video_call_link?: string | null
          education?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_whatsapp?: string | null
          financial_responsible_cpf?: string | null
          financial_responsible_email?: string | null
          financial_responsible_name?: string | null
          financial_responsible_rg?: string | null
          financial_responsible_whatsapp?: string | null
          gender?: string | null
          group_id?: string | null
          id?: string
          marital_status?: string | null
          name?: string
          nationality?: string | null
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          payment_day?: string | null
          phone?: string | null
          photo_url?: string | null
          profession?: string | null
          referral?: string | null
          rg?: string | null
          send_monthly_reminder?: boolean | null
          session_value?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
          video_call_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
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
          name: string
          role: Database["public"]["Enums"]["user_role"] | null
          specialty: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          client_nomenclature?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          has_completed_onboarding?: boolean | null
          id: string
          is_subscribed?: boolean | null
          name: string
          role?: Database["public"]["Enums"]["user_role"] | null
          specialty?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          client_nomenclature?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          has_completed_onboarding?: boolean | null
          id?: string
          is_subscribed?: boolean | null
          name?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          specialty?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          appointment_duration: number | null
          break_time: number | null
          created_at: string | null
          email_reminders_enabled: boolean | null
          id: string
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
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      promote_user_to_admin: {
        Args: { user_email: string }
        Returns: boolean
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
      recurrence_type: "none" | "daily" | "weekly" | "monthly" | "biweekly"
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
      recurrence_type: ["none", "daily", "weekly", "monthly", "biweekly"],
      user_role: ["admin", "user"],
    },
  },
} as const
