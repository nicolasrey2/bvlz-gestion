"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { esConduccion, puedeReportarNovedad } from "@/lib/permisos";
import { TIPOS_NOVEDAD } from "@/lib/dominio";
import type { TipoNovedad } from "@/generated/prisma/client";

export type EstadoForm = { error: string } | null;

// Tipos válidos según el dominio (evita castear un string cualquiera al enum).
const TIPOS_VALIDOS = new Set(TIPOS_NOVEDAD.map((t) => t.value));

const esquema = z.object({
  tipo: z.string(),
  texto: z.string().trim().min(1, "Contá qué pasó."),
});

/// Alta de novedad en el cuaderno del destacamento. Cualquier usuario puede
/// reportar (PRD §4.6); queda registrado con su autoría.
export async function crearNovedad(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const ctx = await getContextoAuth();
  if (!ctx) return { error: "Sesión no válida." };
  if (!puedeReportarNovedad(ctx)) {
    return { error: "No tenés permisos para reportar novedades." };
  }

  const parsed = esquema.safeParse({
    tipo: formData.get("tipo"),
    texto: formData.get("texto"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;

  if (!TIPOS_VALIDOS.has(d.tipo as TipoNovedad)) {
    return { error: "Tipo de novedad inválido." };
  }

  await prisma.novedad.create({
    data: {
      tipo: d.tipo as TipoNovedad,
      texto: d.texto,
      autorId: ctx.usuarioId,
      destacamentoId: ctx.destacamentoId,
    },
  });

  // Se queda en la misma página para poder seguir registrando novedades.
  revalidatePath("/novedades");
  return null;
}

const esquemaEditar = z.object({
  id: z.string().min(1),
  tipo: z.string(),
  texto: z.string().trim().min(1, "Contá qué pasó."),
});

/// Trae una novedad del destacamento del usuario (o null si no existe/no es suya).
async function cargarNovedad(id: string, destacamentoId: string) {
  return prisma.novedad.findFirst({ where: { id, destacamentoId } });
}

/// Solo el autor puede corregir su propia novedad; la conducción también, por
/// si hace falta moderar el cuaderno.
function puedeEditarNovedad(
  ctx: Parameters<typeof esConduccion>[0] & { usuarioId: string },
  novedad: { autorId: string },
): boolean {
  return novedad.autorId === ctx.usuarioId || esConduccion(ctx);
}

/// Edición de una novedad propia: cambia tipo y texto.
export async function editarNovedad(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const ctx = await getContextoAuth();
  if (!ctx) return { error: "Sesión no válida." };

  const parsed = esquemaEditar.safeParse({
    id: formData.get("id"),
    tipo: formData.get("tipo"),
    texto: formData.get("texto"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;

  if (!TIPOS_VALIDOS.has(d.tipo as TipoNovedad)) {
    return { error: "Tipo de novedad inválido." };
  }

  const novedad = await cargarNovedad(d.id, ctx.destacamentoId);
  if (!novedad) return { error: "La novedad no existe." };
  if (!puedeEditarNovedad(ctx, novedad)) {
    return { error: "Solo el autor puede editar esta novedad." };
  }

  await prisma.novedad.update({
    where: { id: novedad.id },
    data: { tipo: d.tipo as TipoNovedad, texto: d.texto },
  });

  revalidatePath("/novedades");
  return null;
}

/// Elimina una novedad propia del cuaderno.
export async function eliminarNovedad(formData: FormData): Promise<void> {
  const ctx = await getContextoAuth();
  if (!ctx) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const novedad = await cargarNovedad(id, ctx.destacamentoId);
  if (!novedad) return;
  if (!puedeEditarNovedad(ctx, novedad)) return;

  await prisma.novedad.delete({ where: { id: novedad.id } });
  revalidatePath("/novedades");
}
