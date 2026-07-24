"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeGestionarGuardias } from "@/lib/permisos";
import type { TipoGuardia } from "@/generated/prisma/client";

export type EstadoForm = { error: string } | null;

const esquema = z.object({
  tipo: z.string(),
  fecha: z.string().min(1, "Elegí una fecha."),
  cuarteleroNombre: z.string().trim().optional(),
  notas: z.string().trim().optional(),
  participantes: z.array(z.string()),
});

// Mes (YYYY-MM) de una fecha ISO "YYYY-MM-DD", para volver al calendario.
function mesDe(fechaISO: string): string {
  return fechaISO.slice(0, 7);
}

/// Alta de guardia. La arma Oficina/conducción (PRD §4.4).
export async function crearGuardia(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const ctx = await getContextoAuth();
  if (!ctx) return { error: "Sesión no válida." };
  if (!puedeGestionarGuardias(ctx)) {
    return { error: "No tenés permisos para armar guardias." };
  }

  const parsed = esquema.safeParse({
    tipo: formData.get("tipo"),
    fecha: formData.get("fecha"),
    cuarteleroNombre: formData.get("cuarteleroNombre") || undefined,
    notas: formData.get("notas") || undefined,
    participantes: formData.getAll("participantes").map(String),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;

  if (d.tipo !== "INTERNA" && d.tipo !== "CUARTELERO") {
    return { error: "Tipo de guardia inválido." };
  }
  const tipo = d.tipo as TipoGuardia;

  if (tipo === "CUARTELERO" && !d.cuarteleroNombre) {
    return { error: "Ingresá el nombre del cuartelero." };
  }

  // Para internas, validar que los participantes sean del destacamento.
  let participantesValidos: { id: string }[] = [];
  if (tipo === "INTERNA") {
    participantesValidos = await prisma.usuario.findMany({
      where: { id: { in: d.participantes }, destacamentoId: ctx.destacamentoId },
      select: { id: true },
    });
    if (participantesValidos.length === 0) {
      return { error: "Elegí al menos un bombero para la guardia interna." };
    }
  }

  await prisma.guardia.create({
    data: {
      destacamentoId: ctx.destacamentoId,
      tipo,
      // La fecha viene como YYYY-MM-DD; se guarda como medianoche local.
      fecha: new Date(`${d.fecha}T00:00:00`),
      cuarteleroNombre: tipo === "CUARTELERO" ? d.cuarteleroNombre : null,
      notas: d.notas,
      participantes:
        tipo === "INTERNA"
          ? { create: participantesValidos.map((u) => ({ usuarioId: u.id })) }
          : undefined,
    },
  });

  const mes = mesDe(d.fecha);
  revalidatePath("/guardias");
  redirect(`/guardias?mes=${mes}`);
}

/// Elimina una guardia (solo conducción).
export async function eliminarGuardia(formData: FormData) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  if (!puedeGestionarGuardias(ctx)) redirect("/guardias");

  const guardiaId = String(formData.get("guardiaId") ?? "");
  await prisma.guardia.deleteMany({
    where: { id: guardiaId, destacamentoId: ctx.destacamentoId },
  });
  revalidatePath("/guardias");
}
