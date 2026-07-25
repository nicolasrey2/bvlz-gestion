import type { EstadoTarea } from "@/generated/prisma/client";

/// Una tarea está vencida si tiene fecha límite anterior a hoy y no está
/// completa. `inicioHoyUTC` = medianoche UTC del día de hoy en Argentina
/// (la fechaLimite se guarda como fecha "día" en UTC; ver lib/fechas.ts).
export function esTareaVencida(
  t: { estado: EstadoTarea; fechaLimite: Date | null },
  inicioHoyUTC: Date,
): boolean {
  return (
    t.estado !== "COMPLETA" &&
    t.fechaLimite !== null &&
    t.fechaLimite < inicioHoyUTC
  );
}
