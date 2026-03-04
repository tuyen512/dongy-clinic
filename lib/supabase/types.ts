export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          name: string;
          owner_user_id: string;
          phone: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_user_id: string;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clinics"]["Insert"]>;
      };
      profiles: {
        Row: {
          user_id: string;
          clinic_id: string;
          role: "owner" | "admin" | "staff";
          full_name: string | null;
          phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          clinic_id: string;
          role?: "owner" | "admin" | "staff";
          full_name?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      customers: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      orders: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
    };
    Views: Record<string, never>;
    Functions: {
      current_clinic_id: { Args: Record<string, never>; Returns: string };
      current_user_role: { Args: Record<string, never>; Returns: "owner" | "admin" | "staff" };
    };
    Enums: {
      app_role: "owner" | "admin" | "staff";
      order_status: "pending" | "processing" | "completed" | "cancelled";
    };
  };
}
