"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { hoyArgentina, rangoDiaUTC } from "@/lib/fechas";
import type { TipoFichada } from "@/generated/prisma/client";

/// Ficha entrada o salida. Se ata a la guardia interna de hoy si al usuario le
/// tocaba; si no le tocaba, se registra igual como "no programada" (PRD §4.5).
export async function fichar(formData: FormData) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");

  const tipo = String(formData.get("tipo") ?? "");
  if (tipo !== "ENTRADA" && tipo !== "SALIDA") return;

  // La guardia de "hoy" se busca por el día del calendario en Argentina
  // (guardia.fecha se almacena como medianoche UTC del día).
  const { y, m, d } = hoyArgentina();
  const dia = rangoDiaUTC(y, m, d);

  const guardia = await prisma.guardia.findFirst({
    where: {
      destacamentoId: ctx.destacamentoId,
      tipo: "INTERNA",
      fecha: { gte: dia.inicio, lt: dia.fin },
      participantes: { some: { usuarioId: ctx.usuarioId } },
    },
  });

  await prisma.fichada.create({
    data: {
      usuarioId: ctx.usuarioId,
      destacamentoId: ctx.destacamentoId,
      tipo: tipo as TipoFichada,
      guardiaId: guardia?.id ?? null,
      noProgramada: !guardia,
    },
  });

  revalidatePath("/fichado");
}
