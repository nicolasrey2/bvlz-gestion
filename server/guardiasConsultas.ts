import { prisma } from "@/lib/prisma";
import { horaArgentina, hoyArgentina, rangoDiaUTC } from "@/lib/fechas";
import type { TipoGuardia } from "@/generated/prisma/client";

const UN_DIA_MS = 24 * 60 * 60 * 1000;

/// Hora a la que termina una guardia: la INTERNA va de 22:00 a 08:00 del día
/// siguiente (PRD §4.4).
const HORA_FIN_GUARDIA = 8;

export type ProximaGuardia = {
  id: string;
  fecha: Date;
  tipo: TipoGuardia;
};

/// Desde qué fecha "día" buscar la próxima guardia.
///
/// Normalmente es hoy, pero **antes de las 08:00 también cuenta la de ayer**:
/// la guardia arranca a las 22:00 y termina a las 08:00, así que pasada la
/// medianoche sigue en curso. Sin esto, quien está de guardia a las 2 de la
/// mañana abre la app y lee "no tenés guardias programadas".
export function desdeParaProximaGuardia(ahora: Date = new Date()): Date {
  const hoy = hoyArgentina(ahora);
  const { inicio } = rangoDiaUTC(hoy.y, hoy.m, hoy.d);
  return horaArgentina(ahora) < HORA_FIN_GUARDIA
    ? new Date(inicio.getTime() - UN_DIA_MS)
    : inicio;
}

/// La próxima guardia de una persona (o la que está en curso). `null` si no
/// tiene ninguna programada.
///
/// Se busca por `GuardiaParticipante` y no por la guardia: es lo que refleja
/// las cesiones, porque `cederGuardia` **borra la fila de quien cede** y crea
/// la de quien la toma (`server/guardias.ts`). Así una guardia cedida deja de
/// aparecer sin lógica extra.
export async function proximaGuardiaDe(
  usuarioId: string,
  destacamentoId: string,
): Promise<ProximaGuardia | null> {
  const participacion = await prisma.guardiaParticipante.findFirst({
    where: {
      usuarioId,
      guardia: { destacamentoId, fecha: { gte: desdeParaProximaGuardia() } },
    },
    orderBy: { guardia: { fecha: "asc" } },
    select: {
      guardia: { select: { id: true, fecha: true, tipo: true } },
    },
  });

  return participacion?.guardia ?? null;
}
