import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Database = {
  public: {
    Tables: {
      staff_profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: string;
          status: string;
          joined_at: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          drug_name: string;
          batch_number: string;
          expiry_date: string;
          safety_threshold: number;
          unit_price: number;
          quantity: number;
          quarantined: boolean;
          created_at: string;
        };
      };
      prescriptions: {
        Row: {
          id: string;
          patient_name: string;
          doctor_name: string;
          patient_history: string[];
          drug_name: string;
          batch_id: string;
          dosage: string;
          prescription_text: string;
          conflict_warning: string | null;
          status: string;
          rejection_reason: string | null;
          created_at: string;
          verified_at: string | null;
          rejected_at: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          timestamp: string;
          action_type: string;
          user_id: string;
          user_role: string;
          payload_delta: string;
        };
      };
      catalog_items: {
        Row: {
          id: string;
          drug_name: string;
          generic_name: string;
          dosage: string;
          category: string;
          is_rx: boolean;
          unit_price: number;
          quantity: number;
          in_stock: boolean;
          image_url: string | null;
          created_at: string;
        };
      };
      customer_orders: {
        Row: {
          id: string;
          patient_name: string;
          items: string[];
          is_rx: boolean;
          status: string;
          created_at: string;
          updated_at: string;
          pickup_ready: boolean;
          contact_full_name: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          contact_address: string | null;
          contact_notes: string | null;
          prescription_file_name: string | null;
          prescription_notes: string | null;
        };
      };
      completed_sales: {
        Row: {
          id: string;
          items: Record<string, unknown>[];
          subtotal: number;
          discount: Record<string, unknown> | null;
          discount_amount: number;
          tax: number;
          total: number;
          payment_method: string;
          amount_tendered: number;
          change_due: number;
          timestamp: string;
        };
      };
      uploaded_prescriptions: {
        Row: {
          id: string;
          file_name: string;
          file_url: string | null;
          doctor_name: string;
          target_drug_name: string | null;
          patient_notes: string | null;
          status: string;
          uploaded_at: string;
          user_id: string | null;
        };
      };
    };
  };
};
