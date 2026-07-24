"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeReportarNovedad } from "@/lib/permisos";
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
