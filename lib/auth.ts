import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { ContextoAuth } from "@/lib/permisos";

/// Usuario autenticado en Supabase (o null). Revalida contra el servidor.
export async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/// Usuario del dominio (tabla Usuario) vinculado a la sesión de Supabase,
/// con sus roles vigentes. null si no está autenticado o no está vinculado.
export async function getUsuarioActual() {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  return prisma.usuario.findUnique({
    where: { authId: authUser.id },
    include: {
      destacamento: true,
      // Solo asignaciones vigentes (vigenteHasta = null).
      asignaciones: { where: { vigenteHasta: null }, include: { area: true } },
    },
  });
}

/// Arma el ContextoAuth que consumen los helpers de lib/permisos.
export async function getContextoAuth(): Promise<ContextoAuth | null> {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;

  return {
    usuarioId: usuario.id,
    destacamentoId: usuario.destacamentoId,
    roles: usuario.asignaciones.map((a) => ({ rol: a.rol, areaId: a.areaId })),
  };
}
