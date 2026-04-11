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
      chart_analysis_logs: {
        Row: {
          created_at: string
          d_checkpoint: string | null
          d_image_url: string | null
          d_market_structure: string | null
          d_pattern: string | null
          d_signal: string | null
          d_tp1: string | null
          d_tp2: string | null
          h1_checkpoint: string | null
          h1_image_url: string | null
          h1_market_structure: string | null
          h1_pattern: string | null
          h1_signal: string | null
          h1_tp1: string | null
          h1_tp2: string | null
          h4_checkpoint: string | null
          h4_image_url: string | null
          h4_market_structure: string | null
          h4_pattern: string | null
          h4_signal: string | null
          h4_tp1: string | null
          h4_tp2: string | null
          id: string
          log_date: string
          main_resistance: string | null
          main_support: string | null
          minor_sr: string | null
          mn_checkpoint: string | null
          mn_image_url: string | null
          mn_market_structure: string | null
          mn_pattern: string | null
          mn_signal: string | null
          mn_tp1: string | null
          mn_tp2: string | null
          updated_at: string
          user_id: string
          w_checkpoint: string | null
          w_image_url: string | null
          w_market_structure: string | null
          w_pattern: string | null
          w_signal: string | null
          w_tp1: string | null
          w_tp2: string | null
        }
        Insert: {
          created_at?: string
          d_checkpoint?: string | null
          d_image_url?: string | null
          d_market_structure?: string | null
          d_pattern?: string | null
          d_signal?: string | null
          d_tp1?: string | null
          d_tp2?: string | null
          h1_checkpoint?: string | null
          h1_image_url?: string | null
          h1_market_structure?: string | null
          h1_pattern?: string | null
          h1_signal?: string | null
          h1_tp1?: string | null
          h1_tp2?: string | null
          h4_checkpoint?: string | null
          h4_image_url?: string | null
          h4_market_structure?: string | null
          h4_pattern?: string | null
          h4_signal?: string | null
          h4_tp1?: string | null
          h4_tp2?: string | null
          id?: string
          log_date: string
          main_resistance?: string | null
          main_support?: string | null
          minor_sr?: string | null
          mn_checkpoint?: string | null
          mn_image_url?: string | null
          mn_market_structure?: string | null
          mn_pattern?: string | null
          mn_signal?: string | null
          mn_tp1?: string | null
          mn_tp2?: string | null
          updated_at?: string
          user_id: string
          w_checkpoint?: string | null
          w_image_url?: string | null
          w_market_structure?: string | null
          w_pattern?: string | null
          w_signal?: string | null
          w_tp1?: string | null
          w_tp2?: string | null
        }
        Update: {
          created_at?: string
          d_checkpoint?: string | null
          d_image_url?: string | null
          d_market_structure?: string | null
          d_pattern?: string | null
          d_signal?: string | null
          d_tp1?: string | null
          d_tp2?: string | null
          h1_checkpoint?: string | null
          h1_image_url?: string | null
          h1_market_structure?: string | null
          h1_pattern?: string | null
          h1_signal?: string | null
          h1_tp1?: string | null
          h1_tp2?: string | null
          h4_checkpoint?: string | null
          h4_image_url?: string | null
          h4_market_structure?: string | null
          h4_pattern?: string | null
          h4_signal?: string | null
          h4_tp1?: string | null
          h4_tp2?: string | null
          id?: string
          log_date?: string
          main_resistance?: string | null
          main_support?: string | null
          minor_sr?: string | null
          mn_checkpoint?: string | null
          mn_image_url?: string | null
          mn_market_structure?: string | null
          mn_pattern?: string | null
          mn_signal?: string | null
          mn_tp1?: string | null
          mn_tp2?: string | null
          updated_at?: string
          user_id?: string
          w_checkpoint?: string | null
          w_image_url?: string | null
          w_market_structure?: string | null
          w_pattern?: string | null
          w_signal?: string | null
          w_tp1?: string | null
          w_tp2?: string | null
        }
        Relationships: []
      }
      chart_analysis_sessions: {
        Row: {
          chart_notes: string | null
          created_at: string
          h1_analysis: string | null
          h1_image_url: string | null
          h4_analysis: string | null
          h4_image_url: string | null
          id: string
          log_id: string | null
          session_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chart_notes?: string | null
          created_at?: string
          h1_analysis?: string | null
          h1_image_url?: string | null
          h4_analysis?: string | null
          h4_image_url?: string | null
          id?: string
          log_id?: string | null
          session_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chart_notes?: string | null
          created_at?: string
          h1_analysis?: string | null
          h1_image_url?: string | null
          h4_analysis?: string | null
          h4_image_url?: string | null
          id?: string
          log_id?: string | null
          session_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_analysis_sessions_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "chart_analysis_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_notes: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          note_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          note_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          note_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_balance: number | null
          created_at: string
          default_risk_percent: number | null
          display_name: string | null
          email: string | null
          id: string
          notification_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_balance?: number | null
          created_at?: string
          default_risk_percent?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          notification_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_balance?: number | null
          created_at?: string
          default_risk_percent?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          notification_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          days_of_week: number[] | null
          id: string
          is_enabled: boolean | null
          reminder_type: string
          time: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[] | null
          id?: string
          is_enabled?: boolean | null
          reminder_type: string
          time: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[] | null
          id?: string
          is_enabled?: boolean | null
          reminder_type?: string
          time?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      risk_decisions: {
        Row: {
          created_at: string
          decision_date: string | null
          decision_made: string
          emotional_state: string | null
          id: string
          is_fomo: boolean | null
          is_revenge_trade: boolean | null
          lessons_learned: string | null
          outcome: string | null
          situation: string
          user_id: string
          was_rule_based: boolean | null
        }
        Insert: {
          created_at?: string
          decision_date?: string | null
          decision_made: string
          emotional_state?: string | null
          id?: string
          is_fomo?: boolean | null
          is_revenge_trade?: boolean | null
          lessons_learned?: string | null
          outcome?: string | null
          situation: string
          user_id: string
          was_rule_based?: boolean | null
        }
        Update: {
          created_at?: string
          decision_date?: string | null
          decision_made?: string
          emotional_state?: string | null
          id?: string
          is_fomo?: boolean | null
          is_revenge_trade?: boolean | null
          lessons_learned?: string | null
          outcome?: string | null
          situation?: string
          user_id?: string
          was_rule_based?: boolean | null
        }
        Relationships: []
      }
      risk_journal_sessions: {
        Row: {
          created_at: string
          emotional_shifts: string | null
          external_factors: string | null
          focus_level: number | null
          followed_plan: string | null
          id: string
          key_decisions: string | null
          mood: string | null
          notes: string | null
          session_date: string
          session_type: string
          sleep_quality: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          emotional_shifts?: string | null
          external_factors?: string | null
          focus_level?: number | null
          followed_plan?: string | null
          id?: string
          key_decisions?: string | null
          mood?: string | null
          notes?: string | null
          session_date: string
          session_type: string
          sleep_quality?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          emotional_shifts?: string | null
          external_factors?: string | null
          focus_level?: number | null
          followed_plan?: string | null
          id?: string
          key_decisions?: string | null
          mood?: string | null
          notes?: string | null
          session_date?: string
          session_type?: string
          sleep_quality?: string | null
          user_id?: string
        }
        Relationships: []
      }
      strategies: {
        Row: {
          created_at: string
          description: string | null
          entry_criteria: string | null
          exit_criteria: string | null
          id: string
          ideal_conditions: string | null
          name: string
          rules: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entry_criteria?: string | null
          exit_criteria?: string | null
          id?: string
          ideal_conditions?: string | null
          name: string
          rules?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entry_criteria?: string | null
          exit_criteria?: string | null
          id?: string
          ideal_conditions?: string | null
          name?: string
          rules?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          trade_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          trade_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_images_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_templates: {
        Row: {
          category: string | null
          created_at: string
          default_stop_loss: number | null
          default_take_profit: number | null
          description: string | null
          id: string
          name: string
          pair: string | null
          timeframe_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_stop_loss?: number | null
          default_take_profit?: number | null
          description?: string | null
          id?: string
          name: string
          pair?: string | null
          timeframe_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_stop_loss?: number | null
          default_take_profit?: number | null
          description?: string | null
          id?: string
          name?: string
          pair?: string | null
          timeframe_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          analysis: string | null
          close_date: string | null
          confidence_level: number | null
          created_at: string
          d_notes: string | null
          d_signal: string | null
          emotional_state: string | null
          entry_price: number | null
          h1_notes: string | null
          h1_signal: string | null
          h4_notes: string | null
          h4_signal: string | null
          id: string
          is_paper_trade: boolean | null
          lot_size: number | null
          mn_notes: string | null
          mn_signal: string | null
          pair: string
          pre_trade_notes: string | null
          profit_loss: number | null
          risk_amount: number | null
          risk_reward_ratio: number | null
          status: string | null
          stop_loss: number | null
          strategy_id: string | null
          take_profit: number | null
          trade_date: string | null
          trade_type: string
          updated_at: string
          user_id: string
          w_notes: string | null
          w_signal: string | null
        }
        Insert: {
          analysis?: string | null
          close_date?: string | null
          confidence_level?: number | null
          created_at?: string
          d_notes?: string | null
          d_signal?: string | null
          emotional_state?: string | null
          entry_price?: number | null
          h1_notes?: string | null
          h1_signal?: string | null
          h4_notes?: string | null
          h4_signal?: string | null
          id?: string
          is_paper_trade?: boolean | null
          lot_size?: number | null
          mn_notes?: string | null
          mn_signal?: string | null
          pair: string
          pre_trade_notes?: string | null
          profit_loss?: number | null
          risk_amount?: number | null
          risk_reward_ratio?: number | null
          status?: string | null
          stop_loss?: number | null
          strategy_id?: string | null
          take_profit?: number | null
          trade_date?: string | null
          trade_type: string
          updated_at?: string
          user_id: string
          w_notes?: string | null
          w_signal?: string | null
        }
        Update: {
          analysis?: string | null
          close_date?: string | null
          confidence_level?: number | null
          created_at?: string
          d_notes?: string | null
          d_signal?: string | null
          emotional_state?: string | null
          entry_price?: number | null
          h1_notes?: string | null
          h1_signal?: string | null
          h4_notes?: string | null
          h4_signal?: string | null
          id?: string
          is_paper_trade?: boolean | null
          lot_size?: number | null
          mn_notes?: string | null
          mn_signal?: string | null
          pair?: string
          pre_trade_notes?: string | null
          profit_loss?: number | null
          risk_amount?: number | null
          risk_reward_ratio?: number | null
          status?: string | null
          stop_loss?: number | null
          strategy_id?: string | null
          take_profit?: number | null
          trade_date?: string | null
          trade_type?: string
          updated_at?: string
          user_id?: string
          w_notes?: string | null
          w_signal?: string | null
        }
        Relationships: []
      }
      trading_goals: {
        Row: {
          created_at: string
          id: string
          is_paper_goal: boolean | null
          month: number
          profit_achieved: number | null
          profit_target: number | null
          trade_count_target: number | null
          updated_at: string
          user_id: string
          win_rate_target: number | null
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_paper_goal?: boolean | null
          month: number
          profit_achieved?: number | null
          profit_target?: number | null
          trade_count_target?: number | null
          updated_at?: string
          user_id: string
          win_rate_target?: number | null
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          is_paper_goal?: boolean | null
          month?: number
          profit_achieved?: number | null
          profit_target?: number | null
          trade_count_target?: number | null
          updated_at?: string
          user_id?: string
          win_rate_target?: number | null
          year?: number
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
