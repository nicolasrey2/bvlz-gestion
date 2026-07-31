"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeGestionarUsuarios } from "@/lib/permisos";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { RANGOS, ROLES_DE_AREA, NOMBRE_ROL } from "@/lib/dominio";
import { campoEmail } from "@/lib/email";
import { generarActivacion, passwordAleatoria } from "@/lib/activacion";
import type { Rango, RolTipo } from "@/generated/prisma/client";

// En éxito devuelve el path del link de activación para que el encargado lo comparta.
export type EstadoForm = { error: string } | { ok: true; path: string } | null;

// En éxito no hay nada más que devolver: la UI solo confirma el guardado.
export type EstadoEditar = { error: string } | { ok: true } | null;

const RANGOS_VALIDOS = new Set(RANGOS.map((r) => r.value));
const ROLES_VALIDOS = new Set(Object.keys(NOMBRE_ROL));

const esquema = z.object({
  nombre: z.string().trim().min(1, "Ingresá el nombre."),
  apellido: z.string().trim().min(1, "Ingresá el apellido."),
  // S4: valida formato de email y lo normaliza a minúsculas antes de guardar.
  email: campoEmail,
  rango: z.string().min(1, "Elegí un rango."),
  rol: z.string().optional(),
  areaId: z.string().optional(),
});

const esquemaEmail = z.object({
  usuarioId: z.string().min(1, "Falta el usuario."),
  email: campoEmail,
});

const esquemaContacto = z.object({
  usuarioId: z.string().min(1, "Falta el usuario."),
  // Todos opcionales: si no vienen (o llegan vacíos) no se tocan.
  nombre: z.string().trim().optional(),
  apellido: z.string().trim().optional(),
  legajo: z.string().trim().optional(),
  dni: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
});

/// Detecta si el error de Supabase Auth al crear una cuenta es por email
/// duplicado. El texto exacto varía entre versiones ("User already
/// registered", "email address already exists", etc.), por eso se busca de
/// forma laxa (case-insensitive, por substring) en vez de comparar exacto.
function esEmailDuplicado(mensaje: string | undefined): boolean {
  if (!mensaje) return false;
  const texto = mensaje.toLowerCase();
  return texto.includes("registered") || texto.includes("exists");
}

/// True si ya hay un usuario con ese email. La comparación es
/// case-insensitive a propósito: `Usuario.email` es `@unique` pero en Postgres
/// esa unicidad distingue mayúsculas, y quedan registros viejos anteriores a
/// S4 sin normalizar. `exceptoId` excluye al usuario que se está editando.
async function emailOcupado(
  email: string,
  exceptoId?: string,
): Promise<boolean> {
  const otro = await prisma.usuario.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      ...(exceptoId ? { id: { not: exceptoId } } : {}),
    },
    select: { id: true },
  });
  return otro !== null;
}

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

  // 4) Unicidad del email antes de tocar Auth: así el mensaje es claro y no
  // hay que crear la cuenta para después revertirla.
  if (await emailOcupado(datos.email)) {
    return { error: "Ya existe un usuario con ese email." };
  }

  // 5) Crear el usuario en Supabase Auth (email ya confirmado).
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: datos.email,
    password: passwordAleatoria(),
    email_confirm: true,
  });
  if (error || !data.user) {
    if (esEmailDuplicado(error?.message)) {
      return { error: "Ya existe un usuario con ese email." };
    }
    return { error: `No se pudo crear la cuenta: ${error?.message ?? "error"}` };
  }

  // 6) Crear el Usuario del dominio (+ rol inicial). Si falla, revertir Auth.
  // La cuenta queda SIN activar: la persona define su contraseña por el link.
  const activacion = generarActivacion();
  try {
    await prisma.usuario.create({
      data: {
        authId: data.user.id,
        email: datos.email,
        nombre: datos.nombre,
        apellido: datos.apellido,
        rango: datos.rango as Rango,
        destacamentoId: ctx.destacamentoId,
        cuentaActivada: false,
        activacionTokenHash: activacion.hash,
        activacionExpira: activacion.expira,
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
  return { ok: true, path: `/activar/${activacion.token}` };
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

/// Edita los datos de contacto de un usuario del destacamento: legajo, DNI,
/// teléfono y, opcionalmente, nombre/apellido. Solo conducción. Los campos
/// vacíos de legajo/DNI/teléfono limpian el dato; nombre/apellido vacíos se
/// dejan como estaban (son obligatorios en el dominio, no se pueden borrar).
export async function editarContacto(
  _prev: EstadoEditar,
  formData: FormData,
): Promise<EstadoEditar> {
  const ctx = await getContextoAuth();
  if (!ctx) return { error: "Sesión no válida." };
  if (!puedeGestionarUsuarios(ctx)) {
    return { error: "No tenés permisos para editar estos datos." };
  }

  const parsed = esquemaContacto.safeParse({
    usuarioId: formData.get("usuarioId"),
    nombre: formData.get("nombre") ?? undefined,
    apellido: formData.get("apellido") ?? undefined,
    legajo: formData.get("legajo") ?? undefined,
    dni: formData.get("dni") ?? undefined,
    telefono: formData.get("telefono") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const { usuarioId, nombre, apellido, legajo, dni, telefono } = parsed.data;

  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, destacamentoId: ctx.destacamentoId },
  });
  if (!usuario) return { error: "Usuario no encontrado." };

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      ...(nombre ? { nombre } : {}),
      ...(apellido ? { apellido } : {}),
      legajo: legajo ? legajo : null,
      dni: dni ? dni : null,
      telefono: telefono ? telefono : null,
    },
  });

  revalidatePath(`/personal/${usuario.id}`);
  return { ok: true };
}

/// Cambia el email de un usuario del destacamento (P7). Solo conducción.
///
/// El email vive en DOS lados y hay que moverlo en los dos: es el identificador
/// de login en Supabase Auth y además la columna `@unique` de `Usuario`. Si se
/// tocara solo la tabla, la persona seguiría entrando con el email viejo y la
/// app mostraría el nuevo.
///
/// La contraseña NO se toca y la cuenta no vuelve a "pendiente": cambiarle el
/// email a alguien no debería obligarlo a reactivar ni cortarle la sesión.
export async function cambiarEmail(
  _prev: EstadoEditar,
  formData: FormData,
): Promise<EstadoEditar> {
  // 1) Autorización en el servidor.
  const ctx = await getContextoAuth();
  if (!ctx) return { error: "Sesión no válida." };
  if (!puedeGestionarUsuarios(ctx)) {
    return { error: "No tenés permisos para cambiar el email." };
  }

  // 2) Validación + normalización (S4).
  const parsed = esquemaEmail.safeParse({
    usuarioId: formData.get("usuarioId"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const { usuarioId, email } = parsed.data;

  // 3) El usuario tiene que ser del mismo destacamento (multi-destacamento).
  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, destacamentoId: ctx.destacamentoId },
  });
  if (!usuario) return { error: "Usuario no encontrado." };
  if (usuario.email === email) {
    return { error: "Ese ya es el email del usuario." };
  }

  // 4) Que no lo tenga otro.
  if (await emailOcupado(email, usuario.id)) {
    return { error: "Ya existe un usuario con ese email." };
  }

  // 5) Auth primero, porque es lo que la persona usa para entrar: si esto
  // falla, no se tocó nada. `email_confirm` deja el mail ya confirmado — la
  // conducción validó quién es, no hace falta el mail de verificación.
  const admin = createSupabaseAdminClient();
  if (usuario.authId) {
    const { error } = await admin.auth.admin.updateUserById(usuario.authId, {
      email,
      email_confirm: true,
    });
    if (error) {
      if (esEmailDuplicado(error.message)) {
        return { error: "Ya existe un usuario con ese email." };
      }
      return { error: `No se pudo cambiar el email: ${error.message}` };
    }
  }

  // 6) Y recién ahí la tabla. Si falla, se revierte Auth para no dejar los dos
  // lados desincronizados (login con uno, app mostrando el otro).
  try {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { email },
    });
  } catch (e) {
    if (usuario.authId) {
      await admin.auth.admin
        .updateUserById(usuario.authId, {
          email: usuario.email,
          email_confirm: true,
        })
        .catch(() => {});
    }
    const msg = e instanceof Error ? e.message : "error";
    return { error: `No se pudo guardar el email: ${msg}` };
  }

  revalidatePath(`/personal/${usuario.id}`);
  revalidatePath("/personal");
  return { ok: true };
}
