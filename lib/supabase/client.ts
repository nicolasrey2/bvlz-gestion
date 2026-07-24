import { createBrowserClient } from "@supabase/ssr";

/// Cliente Supabase para uso en el navegador (Client Components).
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
