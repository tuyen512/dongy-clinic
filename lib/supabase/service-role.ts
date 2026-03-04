import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export const supabaseServiceRole = createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    persistSession: false
  }
});
