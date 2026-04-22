export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          after_json: Json;
          before_json: Json;
          created_at: string;
          entity_id: string | null;
          entity_table: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          after_json?: Json;
          before_json?: Json;
          created_at?: string;
          entity_id?: string | null;
          entity_table: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          after_json?: Json;
          before_json?: Json;
          created_at?: string;
          entity_id?: string | null;
          entity_table?: string;
          id?: string;
          metadata?: Json;
        };
      };
      dealer_financier_assignments: {
        Row: {
          created_at: string;
          dealer_id: string;
          deleted_at: string | null;
          end_date: string | null;
          financier_id: string;
          financial_notes: string | null;
          id: string;
          start_date: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dealer_id: string;
          deleted_at?: string | null;
          end_date?: string | null;
          financier_id: string;
          financial_notes?: string | null;
          id?: string;
          start_date: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dealer_id?: string;
          deleted_at?: string | null;
          end_date?: string | null;
          financier_id?: string;
          financial_notes?: string | null;
          id?: string;
          start_date?: string;
          updated_at?: string;
        };
      };
      dealer_monthly_results: {
        Row: {
          calculation_run_id: string;
          created_at: string;
          dealer_id: string;
          expense_total: string;
          gross_profit_total: string;
          id: string;
          net_profit_total: string;
          period_month: string;
          updated_at: string;
        };
        Insert: {
          calculation_run_id: string;
          created_at?: string;
          dealer_id: string;
          expense_total?: string;
          gross_profit_total?: string;
          id?: string;
          period_month: string;
          updated_at?: string;
        };
        Update: {
          calculation_run_id?: string;
          created_at?: string;
          dealer_id?: string;
          expense_total?: string;
          gross_profit_total?: string;
          id?: string;
          period_month?: string;
          updated_at?: string;
        };
      };
      dealer_partner_shares: {
        Row: {
          created_at: string;
          dealer_id: string;
          deleted_at: string | null;
          id: string;
          notes: string | null;
          partner_id: string;
          share_percentage: string;
          updated_at: string;
          valid_from: string;
          valid_to: string | null;
        };
        Insert: {
          created_at?: string;
          dealer_id: string;
          deleted_at?: string | null;
          id?: string;
          notes?: string | null;
          partner_id: string;
          share_percentage: string;
          updated_at?: string;
          valid_from: string;
          valid_to?: string | null;
        };
        Update: {
          created_at?: string;
          dealer_id?: string;
          deleted_at?: string | null;
          id?: string;
          notes?: string | null;
          partner_id?: string;
          share_percentage?: string;
          updated_at?: string;
          valid_from?: string;
          valid_to?: string | null;
        };
      };
      dealers: {
        Row: {
          code: number;
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          status: Database["public"]["Enums"]["dealer_status"];
          updated_at: string;
        };
        Insert: {
          code: number;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name: string;
          status?: Database["public"]["Enums"]["dealer_status"];
          updated_at?: string;
        };
        Update: {
          code?: number;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["dealer_status"];
          updated_at?: string;
        };
      };
      deal_edit_history: {
        Row: {
          after_json: Json;
          before_json: Json;
          changed_at: string;
          changed_by: string | null;
          deal_id: string;
          id: string;
        };
        Insert: {
          after_json?: Json;
          before_json?: Json;
          changed_at?: string;
          changed_by?: string | null;
          deal_id: string;
          id?: string;
        };
        Update: {
          after_json?: Json;
          before_json?: Json;
          changed_at?: string;
          changed_by?: string | null;
          deal_id?: string;
          id?: string;
        };
      };
      dead_deals: {
        Row: {
          commission_amount: string;
          created_at: string;
          created_by: string | null;
          dead_deal_date: string;
          dealer_id: string;
          dealer_profit: string;
          deleted_at: string | null;
          financier_id: string;
          id: string;
          net_gross_value: string;
          period_month: string;
          updated_at: string;
          updated_by: string | null;
          vin_value: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          dead_deal_date: string;
          dealer_id: string;
          deleted_at?: string | null;
          financier_id: string;
          id?: string;
          net_gross_value: string;
          updated_at?: string;
          updated_by?: string | null;
          vin_value: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          dead_deal_date?: string;
          dealer_id?: string;
          deleted_at?: string | null;
          financier_id?: string;
          id?: string;
          net_gross_value?: string;
          updated_at?: string;
          updated_by?: string | null;
          vin_value?: string;
        };
      };
      deals: {
        Row: {
          commission_amount: string;
          created_at: string;
          created_by: string | null;
          current_payload: Json;
          dealer_id: string;
          deal_profit: string;
          deleted_at: string | null;
          financier_id: string | null;
          id: string;
          is_manually_edited: boolean;
          make_value: string;
          model_value: string;
          net_gross_value: string;
          original_payload: Json;
          period_month: string;
          pickup_value: string;
          sale_value: string;
          source_file_id: string | null;
          source_row_id: string | null;
          source_row_number: number | null;
          updated_at: string;
          updated_by: string | null;
          vin_value: string;
          year_value: number | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          current_payload?: Json;
          dealer_id: string;
          deleted_at?: string | null;
          financier_id?: string | null;
          id?: string;
          is_manually_edited?: boolean;
          make_value: string;
          model_value: string;
          net_gross_value: string;
          original_payload?: Json;
          period_month: string;
          pickup_value?: string;
          sale_value: string;
          source_file_id?: string | null;
          source_row_id?: string | null;
          source_row_number?: number | null;
          updated_at?: string;
          updated_by?: string | null;
          vin_value: string;
          year_value?: number | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          current_payload?: Json;
          dealer_id?: string;
          deleted_at?: string | null;
          financier_id?: string | null;
          id?: string;
          is_manually_edited?: boolean;
          make_value?: string;
          model_value?: string;
          net_gross_value?: string;
          original_payload?: Json;
          period_month?: string;
          pickup_value?: string;
          sale_value?: string;
          source_file_id?: string | null;
          source_row_id?: string | null;
          source_row_number?: number | null;
          updated_at?: string;
          updated_by?: string | null;
          vin_value?: string;
          year_value?: number | null;
        };
      };
      expense_allocations: {
        Row: {
          allocated_amount: string;
          created_at: string;
          dealer_id: string;
          expense_id: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          allocated_amount: string;
          created_at?: string;
          dealer_id: string;
          expense_id: string;
          id?: string;
          updated_at?: string;
        };
        Update: {
          allocated_amount?: string;
          created_at?: string;
          dealer_id?: string;
          expense_id?: string;
          id?: string;
          updated_at?: string;
        };
      };
      expense_categories: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
        };
      };
      expense_recurring_templates: {
        Row: {
          category_id: string | null;
          created_at: string;
          default_amount: string;
          default_description: string | null;
          deleted_at: string | null;
          end_date: string | null;
          id: string;
          is_active: boolean;
          name: string;
          scope_type: Database["public"]["Enums"]["expense_scope_type"];
          selected_dealer_ids: Json;
          start_date: string;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          default_amount: string;
          default_description?: string | null;
          deleted_at?: string | null;
          end_date?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          scope_type: Database["public"]["Enums"]["expense_scope_type"];
          selected_dealer_ids?: Json;
          start_date: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          default_amount?: string;
          default_description?: string | null;
          deleted_at?: string | null;
          end_date?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          scope_type?: Database["public"]["Enums"]["expense_scope_type"];
          selected_dealer_ids?: Json;
          start_date?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          allocation_mode: string;
          amount: string;
          attachment_path: string | null;
          category_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          description: string;
          expense_date: string;
          id: string;
          is_recurring_instance: boolean;
          period_month: string;
          recurring_template_id: string | null;
          selected_dealer_ids: Json;
          scope_type: Database["public"]["Enums"]["expense_scope_type"];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          allocation_mode?: string;
          amount: string;
          attachment_path?: string | null;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          description: string;
          expense_date: string;
          id?: string;
          is_recurring_instance?: boolean;
          period_month: string;
          recurring_template_id?: string | null;
          selected_dealer_ids?: Json;
          scope_type: Database["public"]["Enums"]["expense_scope_type"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          allocation_mode?: string;
          amount?: string;
          attachment_path?: string | null;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string;
          expense_date?: string;
          id?: string;
          is_recurring_instance?: boolean;
          period_month?: string;
          recurring_template_id?: string | null;
          selected_dealer_ids?: Json;
          scope_type?: Database["public"]["Enums"]["expense_scope_type"];
          updated_at?: string;
          updated_by?: string | null;
        };
      };
      financier_aliases: {
        Row: {
          alias: string;
          created_at: string;
          deleted_at: string | null;
          financier_id: string;
          id: string;
          normalized_alias: string;
          updated_at: string;
        };
        Insert: {
          alias: string;
          created_at?: string;
          deleted_at?: string | null;
          financier_id: string;
          id?: string;
          normalized_alias: string;
          updated_at?: string;
        };
        Update: {
          alias?: string;
          created_at?: string;
          deleted_at?: string | null;
          financier_id?: string;
          id?: string;
          normalized_alias?: string;
          updated_at?: string;
        };
      };
      financiers: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_active: boolean;
          name: string;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          notes?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          notes?: string | null;
          updated_at?: string;
        };
      };
      import_files: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          file_hash: string;
          file_name: string;
          id: string;
          metadata: Json;
          period_month: string;
          row_count: number;
          source_type: string;
          status: Database["public"]["Enums"]["import_file_status"];
          storage_path: string;
          template_id: string | null;
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          file_hash: string;
          file_name: string;
          id?: string;
          metadata?: Json;
          period_month: string;
          row_count?: number;
          source_type: string;
          status?: Database["public"]["Enums"]["import_file_status"];
          storage_path: string;
          template_id?: string | null;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          file_hash?: string;
          file_name?: string;
          id?: string;
          metadata?: Json;
          period_month?: string;
          row_count?: number;
          source_type?: string;
          status?: Database["public"]["Enums"]["import_file_status"];
          storage_path?: string;
          template_id?: string | null;
          updated_at?: string;
          uploaded_by?: string | null;
        };
      };
      import_review_actions: {
        Row: {
          edited_at: string;
          edited_by: string | null;
          field_name: string;
          id: string;
          new_value: Json | null;
          old_value: Json | null;
          raw_row_id: string;
        };
        Insert: {
          edited_at?: string;
          edited_by?: string | null;
          field_name: string;
          id?: string;
          new_value?: Json | null;
          old_value?: Json | null;
          raw_row_id: string;
        };
        Update: {
          edited_at?: string;
          edited_by?: string | null;
          field_name?: string;
          id?: string;
          new_value?: Json | null;
          old_value?: Json | null;
          raw_row_id?: string;
        };
      };
      import_templates: {
        Row: {
          column_map_json: Json;
          created_at: string;
          expected_headers: string[];
          id: string;
          is_active: boolean;
          name: string;
          source_type: string;
          updated_at: string;
        };
        Insert: {
          column_map_json?: Json;
          created_at?: string;
          expected_headers: string[];
          id?: string;
          is_active?: boolean;
          name: string;
          source_type: string;
          updated_at?: string;
        };
        Update: {
          column_map_json?: Json;
          created_at?: string;
          expected_headers?: string[];
          id?: string;
          is_active?: boolean;
          name?: string;
          source_type?: string;
          updated_at?: string;
        };
      };
      monthly_calculation_runs: {
        Row: {
          created_at: string;
          error_messages: Json;
          id: string;
          is_current: boolean;
          notes: string | null;
          period_month: string;
          status: Database["public"]["Enums"]["calculation_run_status"];
          summary_json: Json;
          triggered_by: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          error_messages?: Json;
          id?: string;
          is_current?: boolean;
          notes?: string | null;
          period_month: string;
          status?: Database["public"]["Enums"]["calculation_run_status"];
          summary_json?: Json;
          triggered_by?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error_messages?: Json;
          id?: string;
          is_current?: boolean;
          notes?: string | null;
          period_month?: string;
          status?: Database["public"]["Enums"]["calculation_run_status"];
          summary_json?: Json;
          triggered_by?: string | null;
          updated_at?: string;
        };
      };
      partner_monthly_payouts: {
        Row: {
          created_at: string;
          dealer_id: string;
          id: string;
          paid_amount: string | null;
          paid_at: string | null;
          partner_id: string;
          payment_attachment_path: string | null;
          payment_method: string | null;
          payment_note: string | null;
          payment_status: Database["public"]["Enums"]["payment_status"];
          period_month: string;
          selected_result_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dealer_id: string;
          id?: string;
          paid_amount?: string | null;
          paid_at?: string | null;
          partner_id: string;
          payment_attachment_path?: string | null;
          payment_method?: string | null;
          payment_note?: string | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          period_month: string;
          selected_result_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dealer_id?: string;
          id?: string;
          paid_amount?: string | null;
          paid_at?: string | null;
          partner_id?: string;
          payment_attachment_path?: string | null;
          payment_method?: string | null;
          payment_note?: string | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          period_month?: string;
          selected_result_id?: string | null;
          updated_at?: string;
        };
      };
      partner_monthly_results: {
        Row: {
          calculation_run_id: string;
          created_at: string;
          dealer_id: string;
          dealer_net_profit: string;
          id: string;
          partner_amount: string;
          partner_id: string;
          period_month: string;
          share_percentage_snapshot: string;
          updated_at: string;
        };
        Insert: {
          calculation_run_id: string;
          created_at?: string;
          dealer_id: string;
          dealer_net_profit: string;
          id?: string;
          partner_id: string;
          period_month: string;
          share_percentage_snapshot: string;
          updated_at?: string;
        };
        Update: {
          calculation_run_id?: string;
          created_at?: string;
          dealer_id?: string;
          dealer_net_profit?: string;
          id?: string;
          partner_id?: string;
          period_month?: string;
          share_percentage_snapshot?: string;
          updated_at?: string;
        };
      };
      partners: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          display_name: string;
          id: string;
          is_active: boolean;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          display_name: string;
          id?: string;
          is_active?: boolean;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          display_name?: string;
          id?: string;
          is_active?: boolean;
          updated_at?: string;
          user_id?: string | null;
        };
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string;
          id: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
      };
      raw_deal_rows: {
        Row: {
          assigned_dealer_id: string | null;
          assigned_financier_id: string | null;
          created_at: string;
          duplicate_key: string | null;
          duplicate_status: Database["public"]["Enums"]["row_duplicate_status"];
          error_messages: Json;
          finance_normalized: string | null;
          finance_raw: string | null;
          id: string;
          import_file_id: string;
          is_ready_for_consolidation: boolean;
          make_value: string | null;
          model_value: string | null;
          net_gross_value: string | null;
          normalized_payload: Json;
          period_month: string;
          pickup_value: string;
          raw_payload: Json;
          review_status: Database["public"]["Enums"]["row_review_status"];
          row_number: number;
          sale_value: string | null;
          updated_at: string;
          validation_status: Database["public"]["Enums"]["row_validation_status"];
          vin_value: string | null;
          warning_messages: Json;
          year_value: number | null;
        };
        Insert: {
          assigned_dealer_id?: string | null;
          assigned_financier_id?: string | null;
          created_at?: string;
          duplicate_key?: string | null;
          duplicate_status?: Database["public"]["Enums"]["row_duplicate_status"];
          error_messages?: Json;
          finance_normalized?: string | null;
          finance_raw?: string | null;
          id?: string;
          import_file_id: string;
          is_ready_for_consolidation?: boolean;
          make_value?: string | null;
          model_value?: string | null;
          net_gross_value?: string | null;
          normalized_payload?: Json;
          period_month: string;
          pickup_value?: string;
          raw_payload?: Json;
          review_status?: Database["public"]["Enums"]["row_review_status"];
          row_number: number;
          sale_value?: string | null;
          updated_at?: string;
          validation_status?: Database["public"]["Enums"]["row_validation_status"];
          vin_value?: string | null;
          warning_messages?: Json;
          year_value?: number | null;
        };
        Update: {
          assigned_dealer_id?: string | null;
          assigned_financier_id?: string | null;
          created_at?: string;
          duplicate_key?: string | null;
          duplicate_status?: Database["public"]["Enums"]["row_duplicate_status"];
          error_messages?: Json;
          finance_normalized?: string | null;
          finance_raw?: string | null;
          id?: string;
          import_file_id?: string;
          is_ready_for_consolidation?: boolean;
          make_value?: string | null;
          model_value?: string | null;
          net_gross_value?: string | null;
          normalized_payload?: Json;
          period_month?: string;
          pickup_value?: string;
          raw_payload?: Json;
          review_status?: Database["public"]["Enums"]["row_review_status"];
          row_number?: number;
          sale_value?: string | null;
          updated_at?: string;
          validation_status?: Database["public"]["Enums"]["row_validation_status"];
          vin_value?: string | null;
          warning_messages?: Json;
          year_value?: number | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      build_deal_payload: {
        Args: {
          p_dealer_id: string;
          p_financier_id: string | null;
          p_period_month: string;
          p_source_file_id: string | null;
          p_source_row_id: string | null;
          p_source_row_number: number | null;
          p_year_value: number | null;
          p_make_value: string | null;
          p_model_value: string | null;
          p_vin_value: string | null;
          p_sale_value: string | null;
          p_net_gross_value: number | null;
          p_pickup_value: number | null;
          p_finance_raw?: string | null;
          p_finance_normalized?: string | null;
        };
        Returns: Json;
      };
      consolidate_approved_raw_rows: {
        Args: {
          p_row_ids: string[];
          p_actor_user_id?: string | null;
        };
        Returns: {
          deal_id: string | null;
          message: string;
          source_row_id: string;
          status: string;
        }[];
      };
      handle_new_user: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      is_month_start: {
        Args: { p_date: string };
        Returns: boolean;
      };
      run_monthly_calculation: {
        Args: {
          p_period_month: string;
          p_actor_user_id?: string | null;
          p_notes?: string | null;
        };
        Returns: Json;
      };
      set_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      soft_delete_expense: {
        Args: {
          p_expense_id: string;
          p_actor_user_id?: string | null;
        };
        Returns: undefined;
      };
      upsert_expense_with_allocations: {
        Args: {
          p_expense_id?: string | null;
          p_actor_user_id?: string | null;
          p_category_id?: string | null;
          p_recurring_template_id?: string | null;
          p_description?: string | null;
          p_amount?: number | null;
          p_expense_date?: string | null;
          p_period_month?: string | null;
          p_scope_type?: Database["public"]["Enums"]["expense_scope_type"];
          p_selected_dealer_ids?: Json;
          p_attachment_path?: string | null;
          p_is_recurring_instance?: boolean | null;
          p_allocations?: Json;
        };
        Returns: Database["public"]["Tables"]["expenses"]["Row"];
      };
      update_deal_manually: {
        Args: {
          p_deal_id: string;
          p_actor_user_id: string;
          p_dealer_id: string;
          p_financier_id: string | null;
          p_period_month: string;
          p_year_value: number | null;
          p_make_value: string;
          p_model_value: string;
          p_vin_value: string;
          p_sale_value: string;
          p_net_gross_value: number;
          p_pickup_value: number | null;
        };
        Returns: Database["public"]["Tables"]["deals"]["Row"];
      };
    };
    Enums: {
      app_role: "super_admin" | "expense_admin" | "partner_viewer";
      calculation_run_status: "draft" | "completed" | "failed";
      dealer_status: "active" | "paused" | "closed" | "archived";
      expense_scope_type:
        | "single_dealer"
        | "selected_dealers"
        | "all_dealers";
      import_file_status: "uploaded" | "validated" | "consolidated" | "error";
      payment_status: "pending" | "paid";
      row_duplicate_status:
        | "not_checked"
        | "unique"
        | "possible_duplicate"
        | "duplicate";
      row_review_status: "pending" | "approved" | "rejected";
      row_validation_status: "valid" | "warning" | "invalid";
    };
    CompositeTypes: Record<string, never>;
  };
}
