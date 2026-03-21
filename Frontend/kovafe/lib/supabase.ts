import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = "https://vhhbggxrnsqpdbnvvnuk.supabase.co";
const supabaseAnonKey = "vhhbggxrnsqpdbnvvnuk";

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
) as unknown as ReturnType<typeof createClient>;
