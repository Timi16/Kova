import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = "https://vhhbggxrnsqpdbnvvnuk.supabase.co";
const supabaseAnonKey = "vhhbggxrnsqpdbnvvnuk";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
) as unknown as ReturnType<typeof createClient>;

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
) as unknown as ReturnType<typeof createClient>;
