import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = "https://vhhbggxrnsqpdbnvvnuk.supabase.co";
const supabaseAnonKey = "vhhbggxrnsqpdbnvvnuk";
const supabaseServiceKey =
  typeof window === "undefined"
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : undefined;

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
) as unknown as ReturnType<typeof createClient>;

// Compatibility export for stale dev imports. This only initializes on the server.
export const supabaseAdmin =
  typeof window === "undefined" && supabaseServiceKey
    ? (createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }) as unknown as ReturnType<typeof createClient>)
    : undefined;
