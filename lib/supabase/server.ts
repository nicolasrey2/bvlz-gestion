import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/// Cliente Supabase para uso en el servidor (Server Components, Server Actions,
/// Route Handlers). Lee/escribe la sesión desde las cookies de la request.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamado desde un Server Component: ignorar. El refresh de sesión
            // se maneja en el middleware.
          }
        },
      },
    },
  );
}
