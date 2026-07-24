"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { hoyArgentina, rangoDiaUTC } from "@/lib/fechas";
import type { TipoFichada } from "@/generated/prisma/client";

/// Estado que devuelve `fichar` a `useActionState` (mismo patrón que el resto
/// de las Server Actions con formulario, ver `server/novedades.ts`).
export type EstadoFichado = { error: string } | null;

/// Ficha entrada o salida. Se ata a la guardia interna de hoy si al usuario le
/// tocaba; si no le tocaba, se registra igual como "no programada" (PRD §4.5).
/// Antes de crear la fichada valida coherencia: no se puede fichar dos veces
/// el mismo tipo de forma consecutiva (dos entradas sin salida en el medio,
/// o dos salidas sin entrada en el medio).
export async function fichar(
  _prev: EstadoFichado,
  formData: FormData,
): Promise<EstadoFichado> {
  const ctx = await getContextoAuth();
  if (!ctx) return { error: "Sesión no válida. Volvé a iniciar sesión." };

  const tipo = String(formData.get("tipo") ?? "");
  if (tipo !== "ENTRADA" && tipo !== "SALIDA") {
    return { error: "Tipo de fichada inválido." };
  }

  // Coherencia: se mira la última fichada del usuario (sin importar el día)
  // para no permitir dos fichadas iguales seguidas.
  const ultima = await prisma.fichada.findFirst({
    where: { usuarioId: ctx.usuarioId },
    orderBy: { momento: "desc" },
  });
  if (ultima?.tipo === tipo) {
    return {
      error:
        tipo === "ENTRADA"
          ? "Ya fichaste entrada. Fichá la salida antes de volver a entrar."
          : "Ya fichaste salida. Fichá la entrada antes de volver a salir.",
    };
  }

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
  return null;
}
