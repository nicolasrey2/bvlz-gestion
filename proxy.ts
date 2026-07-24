import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renombró "middleware" a "proxy" (runtime Node.js).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Correr en todas las rutas salvo estáticos, assets de imagen y el manifest
  // PWA (que debe ser público para que se pueda instalar la app).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
