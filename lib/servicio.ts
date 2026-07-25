import type { TipoFichada } from "@/generated/prisma/client";

/// Meta mensual de horas de servicio (informativa).
export const META_HORAS_MES = 40;

/// Ventana para considerar a alguien "en servicio" (evita dejar colgado a
/// quien olvidó fichar la salida). 24 hs cubre las guardias más largas.
export const VENTANA_SERVICIO_MS = 24 * 60 * 60 * 1000;

export type FichadaMin = { tipo: TipoFichada; momento: Date };

/// Minutos de servicio emparejando ENTRADA→SALIDA. Una ENTRADA sin SALIDA
/// posterior (turno abierto) cuenta hasta `hasta`. Ignora SALIDA sin ENTRADA
/// previa y ENTRADAs duplicadas. `fichadas` puede venir en cualquier orden.
export function calcularMinutos(fichadas: FichadaMin[], hasta: Date): number {
  const orden = [...fichadas].sort(
    (a, b) => a.momento.getTime() - b.momento.getTime(),
  );
  let total = 0;
  let entrada: Date | null = null;
  for (const f of orden) {
    if (f.tipo === "ENTRADA") {
      if (entrada === null) entrada = f.momento; // dos entradas: vale la 1ª
    } else if (entrada !== null) {
      total += Math.max(0, f.momento.getTime() - entrada.getTime());
      entrada = null;
    }
  }
  if (entrada !== null) {
    total += Math.max(0, hasta.getTime() - entrada.getTime());
  }
  return Math.round(total / 60000);
}

/// "Xh Ym" a partir de minutos.
export function formatearHoras(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h}h ${m}m`;
}

/// ¿Está en servicio? Su última fichada es ENTRADA y es reciente (dentro de la
/// ventana).
export function enServicio(
  ultima: FichadaMin | null,
  ahora: Date,
  ventanaMs = VENTANA_SERVICIO_MS,
): boolean {
  if (!ultima || ultima.tipo !== "ENTRADA") return false;
  return ahora.getTime() - ultima.momento.getTime() <= ventanaMs;
}
