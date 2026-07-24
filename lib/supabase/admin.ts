import { createClient } from "@supabase/supabase-js";

/// Cliente administrador de Supabase (service_role). SOLO servidor: permite
/// crear usuarios de Auth para las altas de personal. NUNCA usar en el cliente.
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
