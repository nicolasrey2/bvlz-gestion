"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeGestionarUsuarios } from "@/lib/permisos";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generarActivacion, hashToken } from "@/lib/activacion";

export type EstadoActivar = { error: string } | null;
export type EstadoRegenerar =
  | { error: string }
  | { ok: true; path: string }
  | null;

const esquemaActivar = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  password2: z.string(),
});

/// Define la contraseña de una cuenta a partir de un token de activación válido.
/// No requiere sesión (es el primer ingreso de la persona).
export async function activarCuenta(
  _prev: EstadoActivar,
  formData: FormData,
): Promise<EstadoActivar> {
  const parsed = esquemaActivar.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    password2: formData.get("password2"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const { token, password, password2 } = parsed.data;
  if (password !== password2) {
    return { error: "Las contraseñas no coinciden." };
  }

  // Token válido = hash coincide, cuenta sin activar y no vencido.
  const usuario = await prisma.usuario.findFirst({
    where: {
      activacionTokenHash: hashToken(token),
      cuentaActivada: false,
      activacionExpira: { gt: new Date() },
    },
  });
  if (!usuario || !usuario.authId) {
    return {
      error:
        "El link de activación no es válido o venció. Pedile uno nuevo al encargado.",
    };
  }

  // Fija la contraseña elegida en Supabase Auth (admin) y activa la cuenta.
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(usuario.authId, {
    password,
  });
  if (error) {
    return { error: "No se pudo definir la contraseña. Intentá de nuevo." };
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      cuentaActivada: true,
      activacionTokenHash: null,
      activacionExpira: null,
    },
  });

  redirect("/login?activada=1");
}

/// Regenera el link de activación de una cuenta pendiente (si venció o se
/// perdió). Solo conducción. Devuelve el nuevo path para compartir.
export async function regenerarActivacion(
  _prev: EstadoRegenerar,
  formData: FormData,
): Promise<EstadoRegenerar> {
  const ctx = await getContextoAuth();
  if (!ctx) return { error: "Sesión no válida." };
  if (!puedeGestionarUsuarios(ctx)) return { error: "Sin permisos." };

  const usuarioId = String(formData.get("usuarioId") ?? "");
  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, destacamentoId: ctx.destacamentoId },
  });
  if (!usuario) return { error: "Usuario no encontrado." };
  if (usuario.cuentaActivada) return { error: "La cuenta ya está activada." };

  const activacion = generarActivacion();
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      activacionTokenHash: activacion.hash,
      activacionExpira: activacion.expira,
    },
  });

  revalidatePath(`/personal/${usuario.id}`);
  return { ok: true, path: `/activar/${activacion.token}` };
}

/// Resetea la contraseña de una cuenta YA activada, reutilizando el mismo
/// mecanismo que la activación inicial: la cuenta vuelve a quedar pendiente
/// (cuentaActivada = false) con un nuevo token, y se devuelve el link para
/// que el encargado se lo pase a la persona y ésta defina una clave nueva.
/// Solo conducción.
export async function resetearPassword(
  _prev: EstadoRegenerar,
  formData: FormData,
): Promise<EstadoRegenerar> {
  const ctx = await getContextoAuth();
  if (!ctx) return { error: "Sesión no válida." };
  if (!puedeGestionarUsuarios(ctx)) return { error: "Sin permisos." };

  const usuarioId = String(formData.get("usuarioId") ?? "");
  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, destacamentoId: ctx.destacamentoId },
  });
  if (!usuario) return { error: "Usuario no encontrado." };
  if (!usuario.cuentaActivada) {
    return { error: "La cuenta todavía no fue activada." };
  }

  const activacion = generarActivacion();
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      cuentaActivada: false,
      activacionTokenHash: activacion.hash,
      activacionExpira: activacion.expira,
    },
  });

  revalidatePath(`/personal/${usuario.id}`);
  return { ok: true, path: `/activar/${activacion.token}` };
}
