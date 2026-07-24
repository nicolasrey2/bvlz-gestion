import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/// Refresca la sesión de Supabase en cada request y redirige a /login a los
/// usuarios no autenticados. Se invoca desde `proxy.ts` (Next 16 renombró
/// "middleware" a "proxy"). OJO: esto NO reemplaza la verificación de permisos
/// dentro de cada Server Action — ver lib/permisos.ts.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalida el token contra Supabase (no confiar en getSession aquí).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rutas públicas: login y callbacks de auth.
  const path = request.nextUrl.pathname;
  const esRutaPublica = path.startsWith("/login") || path.startsWith("/auth");

  if (!user && !esRutaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
