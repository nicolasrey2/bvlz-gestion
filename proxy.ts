import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renombró "middleware" a "proxy" (runtime Node.js).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Correr en todas las rutas salvo estáticos y assets de imagen.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
