"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { esConduccion } from "@/lib/permisos";

export type EstadoUbicacionCuartel = { error: string } | { ok: true } | null;

const esquemaUbicacion = z.object({
  latitud: z.coerce.number().gte(-90).lte(90),
  longitud: z.coerce.number().gte(-180).lte(180),
  radioFichadoM: z.coerce.number().int().positive(),
});

/// Guarda las coordenadas del cuartel y el radio de tolerancia usados por el
/// geo-fichado (suave). Solo conducción puede configurarlo.
export async function guardarUbicacionCuartel(
  _prev: EstadoUbicacionCuartel,
  formData: FormData,
): Promise<EstadoUbicacionCuartel> {
  const ctx = await getContextoAuth();
  if (!ctx) return { error: "Sesión no válida. Volvé a iniciar sesión." };
  if (!esConduccion(ctx)) return { error: "Sin permisos." };

  const parsed = esquemaUbicacion.safeParse({
    latitud: formData.get("latitud"),
    longitud: formData.get("longitud"),
    radioFichadoM: formData.get("radioFichadoM"),
  });
  if (!parsed.success) {
    return { error: "Coordenadas o radio inválidos." };
  }

  await prisma.destacamento.update({
    where: { id: ctx.destacamentoId },
    data: parsed.data,
  });

  revalidatePath("/destacamento");
  return { ok: true };
}
