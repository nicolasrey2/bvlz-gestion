/// Resultado uniforme de una Server Action de escritura (batch 1, ver
/// docs/PLAN-ARRANQUE.md). Convención de feedback "mixto": los errores se
/// muestran inline (con `error`) y los éxitos disparan un toast (con `mensaje`).
/// Las acciones que redirigen en el éxito nunca devuelven `{ ok }` (el
/// redirect() corta la ejecución), así que su feedback de éxito es la navegación.
export type ResultadoAccion =
  | { error: string }
  | { ok: true; mensaje?: string }
  | null;

/// Éxito con un mensaje opcional para el toast.
export function exito(mensaje?: string): ResultadoAccion {
  return { ok: true, mensaje };
}

/// Fallo con el texto de error que se muestra inline.
export function fallo(error: string): ResultadoAccion {
  return { error };
}

/// True si el resultado trae un error para mostrar inline.
export function esError(r: ResultadoAccion): r is { error: string } {
  return r !== null && "error" in r;
}

/// True si el resultado es un éxito (para disparar el toast).
export function esExito(r: ResultadoAccion): r is { ok: true; mensaje?: string } {
  return r !== null && "ok" in r && r.ok;
}
