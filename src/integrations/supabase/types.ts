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
      buildings: {
        Row: {
          id: string
          name: string
          phase_id: string
          sort_order: number
        }
        Insert: {
          id: string
          name: string
          phase_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          phase_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "buildings_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          assignment_notes: string
          contract_date: string | null
          contract_number: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          exit_opportunity_id: string
          id: string
          installment_amount: number | null
          installment_frequency: string
          maintenance_status: string
          next_installment_date: string | null
          original_value: number | null
          owner_id: string
          remaining_installments: number | null
          updated_at: string
          version: number
        }
        Insert: {
          assignment_notes?: string
          contract_date?: string | null
          contract_number?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          exit_opportunity_id: string
          id?: string
          installment_amount?: number | null
          installment_frequency?: string
          maintenance_status?: string
          next_installment_date?: string | null
          original_value?: number | null
          owner_id?: string
          remaining_installments?: number | null
          updated_at?: string
          version?: number
        }
        Update: {
          assignment_notes?: string
          contract_date?: string | null
          contract_number?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          exit_opportunity_id?: string
          id?: string
          installment_amount?: number | null
          installment_frequency?: string
          maintenance_status?: string
          next_installment_date?: string | null
          original_value?: number | null
          owner_id?: string
          remaining_installments?: number | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_exit_opportunity_id_fkey"
            columns: ["exit_opportunity_id"]
            isOneToOne: true
            referencedRelation: "exit_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      exit_opportunities: {
        Row: {
          claimed_remaining_balance: number | null
          claimed_remaining_currency: Database["public"]["Enums"]["currency_code"]
          created_at: string
          current_step: number
          developer_id: string | null
          documents: Json
          exit_amount: number | null
          exit_amount_currency:
            | Database["public"]["Enums"]["currency_code"]
            | null
          id: string
          max_step: number
          project_id: string | null
          seller_id: string
          status: Database["public"]["Enums"]["exit_status"]
          submitted_at: string | null
          transfer: Json
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          claimed_remaining_balance?: number | null
          claimed_remaining_currency?: Database["public"]["Enums"]["currency_code"]
          created_at?: string
          current_step?: number
          developer_id?: string | null
          documents?: Json
          exit_amount?: number | null
          exit_amount_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          id?: string
          max_step?: number
          project_id?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["exit_status"]
          submitted_at?: string | null
          transfer?: Json
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          claimed_remaining_balance?: number | null
          claimed_remaining_currency?: Database["public"]["Enums"]["currency_code"]
          created_at?: string
          current_step?: number
          developer_id?: string | null
          documents?: Json
          exit_amount?: number | null
          exit_amount_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          id?: string
          max_step?: number
          project_id?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["exit_status"]
          submitted_at?: string | null
          transfer?: Json
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exit_opportunities_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_opportunities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_opportunities_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount_claimed: number
          category: Database["public"]["Enums"]["payment_category"]
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          exit_opportunity_id: string
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          owner_id: string
          paid_on: string | null
          principal_claimed: number | null
          reference: string
          sort_order: number
          verification_status: Database["public"]["Enums"]["payment_verification_status"]
        }
        Insert: {
          amount_claimed: number
          category: Database["public"]["Enums"]["payment_category"]
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          exit_opportunity_id: string
          id?: string
          kind: Database["public"]["Enums"]["payment_kind"]
          owner_id?: string
          paid_on?: string | null
          principal_claimed?: number | null
          reference?: string
          sort_order?: number
          verification_status?: Database["public"]["Enums"]["payment_verification_status"]
        }
        Update: {
          amount_claimed?: number
          category?: Database["public"]["Enums"]["payment_category"]
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          exit_opportunity_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          owner_id?: string
          paid_on?: string | null
          principal_claimed?: number | null
          reference?: string
          sort_order?: number
          verification_status?: Database["public"]["Enums"]["payment_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_exit_opportunity_id_fkey"
            columns: ["exit_opportunity_id"]
            isOneToOne: false
            referencedRelation: "exit_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      phases: {
        Row: {
          id: string
          name: string
          project_id: string
          sort_order: number
        }
        Insert: {
          id: string
          name: string
          project_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          project_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string
          created_at: string
          email: string
          full_name: string
          id: string
          national_id: string
          phone: string
          preferred_contact: string
          updated_at: string
        }
        Insert: {
          city?: string
          created_at?: string
          email?: string
          full_name?: string
          id: string
          national_id?: string
          phone?: string
          preferred_contact?: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          national_id?: string
          phone?: string
          preferred_contact?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          developer_id: string
          id: string
          location: string
          name: string
        }
        Insert: {
          created_at?: string
          developer_id: string
          id: string
          location?: string
          name: string
        }
        Update: {
          created_at?: string
          developer_id?: string
          id?: string
          location?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          building_id: string | null
          created_at: string
          delivery_date: string
          finishing: string
          floor: string
          furnished: string
          id: string
          owner_id: string
          phase_id: string | null
          project_id: string
          unit_number: string
          unit_type: string
          updated_at: string
          view: string
        }
        Insert: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_id?: string | null
          created_at?: string
          delivery_date?: string
          finishing?: string
          floor?: string
          furnished?: string
          id?: string
          owner_id?: string
          phase_id?: string | null
          project_id: string
          unit_number?: string
          unit_type?: string
          updated_at?: string
          view?: string
        }
        Update: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_id?: string | null
          created_at?: string
          delivery_date?: string
          finishing?: string
          floor?: string
          furnished?: string
          id?: string
          owner_id?: string
          phase_id?: string | null
          project_id?: string
          unit_number?: string
          unit_type?: string
          updated_at?: string
          view?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      exit_is_editable: { Args: { _id: string }; Returns: boolean }
    }
    Enums: {
      account_status:
        | "PENDING"
        | "ACTIVE"
        | "UNDER_REVIEW"
        | "SUSPENDED"
        | "BLOCKED"
      app_role:
        | "BUYER"
        | "SELLER"
        | "DEVELOPER"
        | "SALES_AGENT"
        | "VERIFICATION_AGENT"
        | "ADMIN"
        | "SUPER_ADMIN"
      currency_code: "EGP" | "USD"
      document_kind:
        | "CONTRACT"
        | "PAYMENT_SCHEDULE"
        | "RECEIPT"
        | "NATIONAL_ID"
        | "AUTHORIZATION"
        | "ASSIGNMENT"
        | "OTHER"
      document_status:
        | "UPLOADED"
        | "PROCESSING"
        | "UNDER_REVIEW"
        | "VERIFIED"
        | "REJECTED"
        | "REPLACEMENT_REQUIRED"
      exit_status:
        | "draft"
        | "pending_review"
        | "under_verification"
        | "documents_required"
        | "verified"
        | "rejected"
        | "published"
      payment_category:
        | "PRINCIPAL"
        | "MAINTENANCE"
        | "TRANSFER_FEE"
        | "ADMIN_FEE"
        | "PENALTY"
        | "INTEREST"
        | "OTHER"
      payment_kind: "down_payment" | "installment" | "other_charge"
      payment_verification_status:
        | "CLAIMED"
        | "VERIFIED"
        | "REJECTED"
        | "ADJUSTED"
      valuation_source:
        | "DEVELOPER_PRICE"
        | "VERIFIED_COMPARABLES"
        | "PROFESSIONAL_VALUATION"
        | "APPROVED_MARKET_DATA"
        | "ADMIN_REVIEW"
      valuation_status: "DRAFT" | "VERIFIED" | "SUPERSEDED"
      verification_check_status: "PENDING" | "PASSED" | "FAILED" | "NEEDS_INFO"
      verification_check_type:
        | "IDENTITY"
        | "CONTRACT"
        | "UNIT_PROJECT_DEVELOPER"
        | "PAYMENTS"
        | "REMAINING_BALANCE"
        | "TRANSFER_ELIGIBILITY"
        | "CANCELLATION_TERMS"
        | "MARKET_VALUE"
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
      account_status: [
        "PENDING",
        "ACTIVE",
        "UNDER_REVIEW",
        "SUSPENDED",
        "BLOCKED",
      ],
      app_role: [
        "BUYER",
        "SELLER",
        "DEVELOPER",
        "SALES_AGENT",
        "VERIFICATION_AGENT",
        "ADMIN",
        "SUPER_ADMIN",
      ],
      currency_code: ["EGP", "USD"],
      document_kind: [
        "CONTRACT",
        "PAYMENT_SCHEDULE",
        "RECEIPT",
        "NATIONAL_ID",
        "AUTHORIZATION",
        "ASSIGNMENT",
        "OTHER",
      ],
      document_status: [
        "UPLOADED",
        "PROCESSING",
        "UNDER_REVIEW",
        "VERIFIED",
        "REJECTED",
        "REPLACEMENT_REQUIRED",
      ],
      exit_status: [
        "draft",
        "pending_review",
        "under_verification",
        "documents_required",
        "verified",
        "rejected",
        "published",
      ],
      payment_category: [
        "PRINCIPAL",
        "MAINTENANCE",
        "TRANSFER_FEE",
        "ADMIN_FEE",
        "PENALTY",
        "INTEREST",
        "OTHER",
      ],
      payment_kind: ["down_payment", "installment", "other_charge"],
      payment_verification_status: [
        "CLAIMED",
        "VERIFIED",
        "REJECTED",
        "ADJUSTED",
      ],
      valuation_source: [
        "DEVELOPER_PRICE",
        "VERIFIED_COMPARABLES",
        "PROFESSIONAL_VALUATION",
        "APPROVED_MARKET_DATA",
        "ADMIN_REVIEW",
      ],
      valuation_status: ["DRAFT", "VERIFIED", "SUPERSEDED"],
      verification_check_status: ["PENDING", "PASSED", "FAILED", "NEEDS_INFO"],
      verification_check_type: [
        "IDENTITY",
        "CONTRACT",
        "UNIT_PROJECT_DEVELOPER",
        "PAYMENTS",
        "REMAINING_BALANCE",
        "TRANSFER_ELIGIBILITY",
        "CANCELLATION_TERMS",
        "MARKET_VALUE",
      ],
    },
  },
} as const
