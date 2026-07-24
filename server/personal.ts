"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeGestionarUsuarios } from "@/lib/permisos";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { RANGOS, ROLES_DE_AREA, NOMBRE_ROL } from "@/lib/dominio";
import type { Rango, RolTipo } from "@/generated/prisma/client";

export type EstadoForm = { error: string } | null;

const RANGOS_VALIDOS = new Set(RANGOS.map((r) => r.value));
const ROLES_VALIDOS = new Set(Object.keys(NOMBRE_ROL));

const esquema = z.object({
  nombre: z.string().trim().min(1, "Ingresá el nombre."),
  apellido: z.string().trim().min(1, "Ingresá el apellido."),
  email: z.string().trim().min(3, "Ingresá un email válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  rango: z.string().min(1, "Elegí un rango."),
  rol: z.string().optional(),
  areaId: z.string().optional(),
});

/// Alta de un usuario del destacamento. Solo la conducción del dto (PRD §3.5).
/// Crea el usuario en Supabase Auth y lo vincula con la tabla Usuario, con un
/// rol inicial opcional. Firma compatible con useActionState.
export async function crearUsuario(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  // 1) Autorización en el servidor (nunca confiar solo en la UI).
  const ctx = await getContextoAuth();
  if (!ctx) return { error: "Sesión no válida." };
  if (!puedeGestionarUsuarios(ctx)) {
    return { error: "No tenés permisos para dar de alta usuarios." };
  }

  // 2) Validación de entrada.
  const parsed = esquema.safeParse({
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    email: formData.get("email"),
    password: formData.get("password"),
    rango: formData.get("rango"),
    rol: formData.get("rol") || undefined,
    areaId: formData.get("areaId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const datos = parsed.data;

  if (!RANGOS_VALIDOS.has(datos.rango as Rango)) {
    return { error: "Rango inválido." };
  }

  // 3) Validación del rol inicial (si se indicó).
  const rol = datos.rol as RolTipo | undefined;
  let areaId: string | null = null;
  if (rol) {
    if (!ROLES_VALIDOS.has(rol)) return { error: "Rol inválido." };
    if (ROLES_DE_AREA.includes(rol)) {
      if (!datos.areaId) return { error: "Elegí el área para ese rol." };
      // El área debe pertenecer al destacamento del usuario que da el alta.
      const area = await prisma.area.findFirst({
        where: { id: datos.areaId, destacamentoId: ctx.destacamentoId },
      });
      if (!area) return { error: "El área seleccionada no es válida." };
      areaId = area.id;
    }
  }

  // 4) Crear el usuario en Supabase Auth (email ya confirmado).
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: datos.email,
    password: datos.password,
    email_confirm: true,
  });
  if (error || !data.user) {
    return { error: `No se pudo crear la cuenta: ${error?.message ?? "error"}` };
  }

  // 5) Crear el Usuario del dominio (+ rol inicial). Si falla, revertir Auth.
  try {
    await prisma.usuario.create({
      data: {
        authId: data.user.id,
        email: datos.email,
        nombre: datos.nombre,
        apellido: datos.apellido,
        rango: datos.rango as Rango,
        destacamentoId: ctx.destacamentoId,
        ...(rol ? { asignaciones: { create: { rol, areaId } } } : {}),
      },
    });
  } catch (e) {
    // Rollback del usuario de Auth para no dejar cuentas huérfanas.
    await supabaseAdmin.auth.admin.deleteUser(data.user.id).catch(() => {});
    const msg = e instanceof Error ? e.message : "error";
    return { error: `No se pudo guardar el usuario: ${msg}` };
  }

  revalidatePath("/personal");
  redirect("/personal");
}

/// Verifica sesión + permiso de gestión. Redirige si no corresponde.
async function exigirConduccion() {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  if (!puedeGestionarUsuarios(ctx)) redirect("/");
  return ctx;
}

/// Roles con un único titular vigente (rotan: al asignar, se cierra el anterior).
const SINGLETON_DTO = new Set<RolTipo>(["ENCARGADO_INTERNO", "SUB_ENCARGADO"]);

/// Cambia el rango (jerarquía) de un usuario del destacamento.
export async function cambiarRango(formData: FormData) {
  const ctx = await exigirConduccion();
  const usuarioId = String(formData.get("usuarioId") ?? "");
  const rango = String(formData.get("rango") ?? "") as Rango;
  if (!RANGOS_VALIDOS.has(rango)) return;

  await prisma.usuario.updateMany({
    where: { id: usuarioId, destacamentoId: ctx.destacamentoId },
    data: { rango },
  });
  revalidatePath(`/personal/${usuarioId}`);
}

/// Activa o desactiva un usuario (baja lógica, conserva el historial).
export async function cambiarEstadoUsuario(formData: FormData) {
  const ctx = await exigirConduccion();
  const usuarioId = String(formData.get("usuarioId") ?? "");
  const activo = formData.get("activo") === "true";

  await prisma.usuario.updateMany({
    where: { id: usuarioId, destacamentoId: ctx.destacamentoId },
    data: { activo },
  });
  revalidatePath(`/personal/${usuarioId}`);
}

/// Finaliza un rol vigente (rotación): marca vigenteHasta = ahora sin borrar.
export async function finalizarRol(formData: FormData) {
  const ctx = await exigirConduccion();
  const asignacionId = String(formData.get("asignacionId") ?? "");
  const usuarioId = String(formData.get("usuarioId") ?? "");

  await prisma.asignacionRol.updateMany({
    where: {
      id: asignacionId,
      vigenteHasta: null,
      usuario: { destacamentoId: ctx.destacamentoId },
    },
    data: { vigenteHasta: new Date() },
  });
  revalidatePath(`/personal/${usuarioId}`);
}

/// Asigna un rol a un usuario. Para roles de titular único (encargado interno,
/// sub-encargado, encargado de un área) cierra al titular anterior — así queda
/// registrada la rotación en el historial.
export async function asignarRol(formData: FormData) {
  const ctx = await exigirConduccion();
  const usuarioId = String(formData.get("usuarioId") ?? "");
  const rol = String(formData.get("rol") ?? "") as RolTipo;
  if (!ROLES_VALIDOS.has(rol)) return;

  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, destacamentoId: ctx.destacamentoId },
  });
  if (!usuario) return;

  // Resolver el área si el rol la requiere.
  let areaId: string | null = null;
  if (ROLES_DE_AREA.includes(rol)) {
    const area = await prisma.area.findFirst({
      where: {
        id: String(formData.get("areaId") ?? ""),
        destacamentoId: ctx.destacamentoId,
      },
    });
    if (!area) return;
    areaId = area.id;
  }

  // Si ya tiene esa asignación vigente, no hacer nada.
  const yaVigente = await prisma.asignacionRol.findFirst({
    where: { usuarioId, rol, areaId, vigenteHasta: null },
  });
  if (yaVigente) {
    revalidatePath(`/personal/${usuarioId}`);
    return;
  }

  const ahora = new Date();

  // Rotación de roles de titular único.
  if (SINGLETON_DTO.has(rol)) {
    await prisma.asignacionRol.updateMany({
      where: {
        rol,
        vigenteHasta: null,
        usuario: { destacamentoId: ctx.destacamentoId },
      },
      data: { vigenteHasta: ahora },
    });
  } else if (rol === "ENCARGADO_AREA" && areaId) {
    await prisma.asignacionRol.updateMany({
      where: { rol, areaId, vigenteHasta: null },
      data: { vigenteHasta: ahora },
    });
  }

  await prisma.asignacionRol.create({ data: { usuarioId, rol, areaId } });
  revalidatePath(`/personal/${usuarioId}`);
}
