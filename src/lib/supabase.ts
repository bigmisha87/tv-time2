import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    "Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
  );
}

// One shared server-side client. The service-role key never reaches the browser
// because every caller of this module runs only in Server Components / actions.
export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
