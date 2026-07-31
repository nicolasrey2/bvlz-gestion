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

/// Usuario del dominio (tabla Usuario) vinculado a la sesión de Supabase, con
/// sus roles vigentes, SIN filtrar por estado. null si no está autenticado o no
/// está vinculado.
///
/// Solo para los pocos casos que necesitan distinguir "no está vinculado" de
/// "está dado de baja" — hoy, la home, para poder mostrar el mensaje correcto.
/// Para operar hay que usar `getUsuarioActual()`.
export async function getUsuarioVinculado() {
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

/// Usuario habilitado para operar: null si no está autenticado, si no está
/// vinculado o si está dado de baja (`activo = false`).
///
/// S1 — la baja lógica corta el acceso. El chequeo va acá y no en el proxy por
/// dos razones: el proxy no tiene acceso a Prisma, y esta función es el único
/// camino hacia el `ContextoAuth`, así que cortando en un solo lugar quedan
/// cubiertas todas las páginas y todas las Server Actions de una vez. Sin esto,
/// desactivar a alguien no lo echaba: seguía operando hasta que venciera su
/// sesión de Supabase.
export async function getUsuarioActual() {
  const usuario = await getUsuarioVinculado();
  if (!usuario || !usuario.activo) return null;
  return usuario;
}

/// Arma el ContextoAuth que consumen los helpers de lib/permisos.
type UsuarioActual = NonNullable<Awaited<ReturnType<typeof getUsuarioActual>>>;

/// Deriva el ContextoAuth de un Usuario ya cargado, sin volver a consultar la
/// DB (útil en páginas que ya trajeron el usuario, como la home).
export function contextoDesdeUsuario(usuario: UsuarioActual): ContextoAuth {
  return {
    usuarioId: usuario.id,
    destacamentoId: usuario.destacamentoId,
    roles: usuario.asignaciones.map((a) => ({ rol: a.rol, areaId: a.areaId })),
  };
}

export async function getContextoAuth(): Promise<ContextoAuth | null> {
  const usuario = await getUsuarioActual();
  return usuario ? contextoDesdeUsuario(usuario) : null;
}
