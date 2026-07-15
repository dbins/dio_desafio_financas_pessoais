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
      conversas: {
        Row: {
          criado_em: string
          dados_extraidos: Json | null
          id: string
          mensagem: string
          thread_id: string
          tipo_mensagem: Database["public"]["Enums"]["tipo_mensagem"]
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          dados_extraidos?: Json | null
          id?: string
          mensagem: string
          thread_id: string
          tipo_mensagem: Database["public"]["Enums"]["tipo_mensagem"]
          usuario_id: string
        }
        Update: {
          criado_em?: string
          dados_extraidos?: Json | null
          id?: string
          mensagem?: string
          thread_id?: string
          tipo_mensagem?: Database["public"]["Enums"]["tipo_mensagem"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversas_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_threads: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          titulo: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          titulo?: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          titulo?: string
          usuario_id?: string
        }
        Relationships: []
      }
      metas_financeiras: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          nome: string
          prazo: string | null
          status: Database["public"]["Enums"]["status_meta"]
          usuario_id: string
          valor_atual: number
          valor_objetivo: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          nome: string
          prazo?: string | null
          status?: Database["public"]["Enums"]["status_meta"]
          usuario_id: string
          valor_atual?: number
          valor_objetivo: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          nome?: string
          prazo?: string | null
          status?: Database["public"]["Enums"]["status_meta"]
          usuario_id?: string
          valor_atual?: number
          valor_objetivo?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          atualizado_em: string
          criado_em: string
          email: string
          id: string
          nome: string
          objetivo_financeiro:
            | Database["public"]["Enums"]["objetivo_financeiro"]
            | null
          onboarding_completo: boolean
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          email: string
          id: string
          nome?: string
          objetivo_financeiro?:
            | Database["public"]["Enums"]["objetivo_financeiro"]
            | null
          onboarding_completo?: boolean
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          email?: string
          id?: string
          nome?: string
          objetivo_financeiro?:
            | Database["public"]["Enums"]["objetivo_financeiro"]
            | null
          onboarding_completo?: boolean
        }
        Relationships: []
      }
      transacoes: {
        Row: {
          atualizado_em: string
          categoria: string
          confianca_ia: number | null
          criado_em: string
          data_transacao: string
          descricao: string
          id: string
          origem_registro: Database["public"]["Enums"]["origem_registro"]
          tipo: Database["public"]["Enums"]["tipo_transacao"]
          usuario_id: string
          valor: number
        }
        Insert: {
          atualizado_em?: string
          categoria: string
          confianca_ia?: number | null
          criado_em?: string
          data_transacao?: string
          descricao?: string
          id?: string
          origem_registro?: Database["public"]["Enums"]["origem_registro"]
          tipo: Database["public"]["Enums"]["tipo_transacao"]
          usuario_id: string
          valor: number
        }
        Update: {
          atualizado_em?: string
          categoria?: string
          confianca_ia?: number | null
          criado_em?: string
          data_transacao?: string
          descricao?: string
          id?: string
          origem_registro?: Database["public"]["Enums"]["origem_registro"]
          tipo?: Database["public"]["Enums"]["tipo_transacao"]
          usuario_id?: string
          valor?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      objetivo_financeiro:
        | "economizar"
        | "controlar_gastos"
        | "sair_das_dividas"
        | "guardar_dinheiro"
        | "outro"
      origem_registro: "chat" | "manual"
      status_meta: "ativa" | "concluida" | "cancelada"
      tipo_mensagem: "usuario" | "assistente"
      tipo_transacao: "receita" | "despesa"
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
      objetivo_financeiro: [
        "economizar",
        "controlar_gastos",
        "sair_das_dividas",
        "guardar_dinheiro",
        "outro",
      ],
      origem_registro: ["chat", "manual"],
      status_meta: ["ativa", "concluida", "cancelada"],
      tipo_mensagem: ["usuario", "assistente"],
      tipo_transacao: ["receita", "despesa"],
    },
  },
} as const
