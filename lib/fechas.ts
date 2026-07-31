// Utilidades de fecha/hora. Fuente única de verdad para el formateo, con la
// zona horaria de Argentina — clave porque el servidor (Vercel) corre en UTC.
//
// Dos conceptos distintos:
//  - INSTANTES (timestamps reales: fichadas, comentarios, createdAt…) → se
//    formatean en hora de Argentina.
//  - FECHAS "día" (guardias, fecha límite, fecha del parte: se guardan como
//    medianoche UTC y representan un día del calendario) → se formatean en UTC
//    para no correrse un día.

export const TZ = "America/Argentina/Buenos_Aires";

// --- Instantes (hora de Argentina) ------------------------------------------

// hourCycle "h23" fuerza 0–23 con medianoche = "00" (no "24"). Con `hour12:
// false` algunas versiones de ICU usan el ciclo 1–24 y muestran "24:05".
export function fmtFechaHora(d: Date): string {
  return d.toLocaleString("es-AR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function fmtHora(d: Date): string {
  return d.toLocaleTimeString("es-AR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function fmtFecha(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// --- Fechas "día" (medianoche UTC) ------------------------------------------

export function fmtFechaDia(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function fmtDiaSemana(d: Date): string {
  return d.toLocaleDateString("es-AR", { timeZone: "UTC", weekday: "short" });
}

/// Fecha "día" en el formato que espera un `<input type="date">`
/// (`aaaa-mm-dd`), para precargar un formulario de edición. En UTC por el mismo
/// motivo que `fmtFechaDia`: si no, el campo aparece con el día anterior.
export function fmtFechaInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// --- Cálculo del "día de hoy" en Argentina ----------------------------------

/// Partes del día actual en Argentina: { y, m (1-12), d }.
export function hoyArgentina(): { y: number; m: number; d: number } {
  // "en-CA" da formato ISO "YYYY-MM-DD".
  const [y, m, d] = new Date()
    .toLocaleDateString("en-CA", { timeZone: TZ })
    .split("-")
    .map(Number);
  return { y, m, d };
}

/// Rango [inicio, fin) del día AR como INSTANTES (para timestamps; Argentina es
/// UTC-3, sin horario de verano).
export function rangoDiaAR(y: number, m: number, d: number) {
  const p = (n: number) => String(n).padStart(2, "0");
  const inicio = new Date(`${y}-${p(m)}-${p(d)}T00:00:00-03:00`);
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  return { inicio, fin };
}

/// Rango [inicio, fin) de un día como medianoches UTC (para fechas "día").
export function rangoDiaUTC(y: number, m: number, d: number) {
  return {
    inicio: new Date(Date.UTC(y, m - 1, d)),
    fin: new Date(Date.UTC(y, m - 1, d + 1)),
  };
}

/// Rango [inicio, fin) de un mes como medianoches UTC (para guardia.fecha).
export function rangoMesUTC(y: number, m: number) {
  return {
    inicio: new Date(Date.UTC(y, m - 1, 1)),
    fin: new Date(Date.UTC(y, m, 1)),
  };
}

/// Rango [inicio, fin) de un mes como INSTANTES en hora de Argentina (para
/// timestamps como fichadas). m es 1-12; maneja el cambio de año dic→ene.
export function rangoMesAR(y: number, m: number) {
  const p = (n: number) => String(n).padStart(2, "0");
  const inicio = new Date(`${y}-${p(m)}-01T00:00:00-03:00`);
  const finY = m === 12 ? y + 1 : y;
  const finM = m === 12 ? 1 : m + 1;
  const fin = new Date(`${finY}-${p(finM)}-01T00:00:00-03:00`);
  return { inicio, fin };
}
