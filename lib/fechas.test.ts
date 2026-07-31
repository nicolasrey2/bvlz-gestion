import { describe, expect, it } from "vitest";
import {
  diasHasta,
  fmtDiaNumeroMes,
  fmtDiaSemana,
  fmtFecha,
  fmtFechaDia,
  fmtFechaHora,
  fmtFechaInput,
  fmtHora,
  horaArgentina,
  hoyArgentina,
  rangoDiaAR,
  rangoDiaUTC,
  rangoMesAR,
  rangoMesUTC,
} from "@/lib/fechas";

// El servidor corre en UTC (Vercel); Argentina es UTC-3 sin horario de verano.
// 2026-07-24T01:30:00Z son las 22:30 del día ANTERIOR (23/07) en Argentina.
const INSTANTE = new Date("2026-07-24T01:30:00Z");

// No debe aparecer "a. m."/"p. m." — el formateo tiene que ser 24h.
const AM_PM = /[ap]\.\s?m\.?/i;

describe("fmtFechaHora (instante → hora de Argentina)", () => {
  it("muestra la hora en 24h corrida a Argentina (UTC-3)", () => {
    const out = fmtFechaHora(INSTANTE);
    expect(out).toContain("22:30");
  });

  it("muestra el día 23/07 (un día antes que en UTC)", () => {
    // El día/mes puede o no venir con cero de relleno según el motor de Intl,
    // por eso el regex tolera "23/7" y "23/07" — lo que importa es que el día
    // corrido a Argentina sea el 23, no el 24 (que es la fecha en UTC).
    const out = fmtFechaHora(INSTANTE);
    expect(out).toMatch(/23\/0?7/);
  });

  it("no usa formato 12h (no aparece a.m./p.m.)", () => {
    expect(fmtFechaHora(INSTANTE)).not.toMatch(AM_PM);
  });
});

describe("fmtHora (instante → hora de Argentina)", () => {
  it("devuelve la hora en 24h corrida a Argentina", () => {
    expect(fmtHora(INSTANTE)).toBe("22:30");
  });

  it("no usa formato 12h", () => {
    expect(fmtHora(INSTANTE)).not.toMatch(AM_PM);
  });

  it("rellena con cero las horas de un solo dígito", () => {
    // 03:05 UTC → 00:05 en Argentina.
    expect(fmtHora(new Date("2026-07-24T03:05:00Z"))).toBe("00:05");
  });
});

describe("fmtFecha (instante → fecha AR dd/mm/aaaa)", () => {
  it("formatea dd/mm/aaaa corrido a Argentina", () => {
    expect(fmtFecha(INSTANTE)).toBe("23/07/2026");
  });

  it("rellena con cero día y mes de un solo dígito", () => {
    // 2026-01-05T02:00:00Z → 2026-01-04 23:00 en Argentina.
    expect(fmtFecha(new Date("2026-01-05T02:00:00Z"))).toBe("04/01/2026");
  });
});

describe("fmtFechaDia (fecha 'día' en medianoche UTC, sin corrimiento)", () => {
  it("muestra el día 24, no el 23 (no se corre por zona horaria)", () => {
    const dia = new Date("2026-07-24T00:00:00Z");
    expect(fmtFechaDia(dia)).toBe("24/07/2026");
  });

  it("rellena con cero día y mes de un solo dígito", () => {
    const dia = new Date("2026-07-05T00:00:00Z");
    expect(fmtFechaDia(dia)).toBe("05/07/2026");
  });
});

describe("fmtDiaSemana (fecha 'día' en medianoche UTC, sin corrimiento)", () => {
  it("devuelve el día de la semana correcto para la fecha en UTC", () => {
    // 2026-07-24 es viernes.
    expect(fmtDiaSemana(new Date("2026-07-24T00:00:00Z"))).toBe("vie");
  });

  it("no se corre de día por zona horaria (23/07 es jueves, no viernes)", () => {
    expect(fmtDiaSemana(new Date("2026-07-23T00:00:00Z"))).toBe("jue");
  });
});

describe("hoyArgentina", () => {
  it("devuelve y/m/d numéricos plausibles", () => {
    const { y, m, d } = hoyArgentina();
    expect(typeof y).toBe("number");
    expect(typeof m).toBe("number");
    expect(typeof d).toBe("number");
    expect(y).toBeGreaterThan(2000);
    expect(m).toBeGreaterThanOrEqual(1);
    expect(m).toBeLessThanOrEqual(12);
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThanOrEqual(31);
    expect(Number.isInteger(y)).toBe(true);
    expect(Number.isInteger(m)).toBe(true);
    expect(Number.isInteger(d)).toBe(true);
  });
});

describe("rangoDiaAR (rango de un día AR como instantes UTC)", () => {
  it("calcula inicio y fin corridos -03:00", () => {
    const { inicio, fin } = rangoDiaAR(2026, 7, 24);
    expect(inicio.toISOString()).toBe("2026-07-24T03:00:00.000Z");
    expect(fin.toISOString()).toBe("2026-07-25T03:00:00.000Z");
  });

  it("el rango dura exactamente 24 horas", () => {
    const { inicio, fin } = rangoDiaAR(2026, 7, 24);
    expect(fin.getTime() - inicio.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("rellena con cero mes y día de un solo dígito", () => {
    const { inicio, fin } = rangoDiaAR(2026, 1, 5);
    expect(inicio.toISOString()).toBe("2026-01-05T03:00:00.000Z");
    expect(fin.toISOString()).toBe("2026-01-06T03:00:00.000Z");
  });
});

describe("rangoDiaUTC (rango de un día 'fecha' como medianoches UTC)", () => {
  it("calcula inicio y fin en medianoche UTC", () => {
    const { inicio, fin } = rangoDiaUTC(2026, 7, 24);
    expect(inicio.toISOString()).toBe("2026-07-24T00:00:00.000Z");
    expect(fin.toISOString()).toBe("2026-07-25T00:00:00.000Z");
  });

  it("maneja el cambio de mes", () => {
    const { inicio, fin } = rangoDiaUTC(2026, 7, 31);
    expect(inicio.toISOString()).toBe("2026-07-31T00:00:00.000Z");
    expect(fin.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });
});

describe("rangoMesUTC (rango de un mes como medianoches UTC)", () => {
  it("calcula inicio y fin del mes en UTC", () => {
    const { inicio, fin } = rangoMesUTC(2026, 7);
    expect(inicio.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(fin.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });

  it("maneja el cambio de año (diciembre → enero)", () => {
    const { inicio, fin } = rangoMesUTC(2026, 12);
    expect(inicio.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(fin.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("rangoMesAR (rango de un mes AR como instantes UTC)", () => {
  it("calcula inicio y fin corridos -03:00 (medianoche local = 03:00Z)", () => {
    const { inicio, fin } = rangoMesAR(2026, 7);
    expect(inicio.toISOString()).toBe("2026-07-01T03:00:00.000Z");
    expect(fin.toISOString()).toBe("2026-08-01T03:00:00.000Z");
  });

  it("rellena con cero el mes de un solo dígito", () => {
    const { inicio } = rangoMesAR(2026, 1);
    expect(inicio.toISOString()).toBe("2026-01-01T03:00:00.000Z");
  });

  it("maneja el cambio de año (diciembre → enero)", () => {
    const { inicio, fin } = rangoMesAR(2026, 12);
    expect(inicio.toISOString()).toBe("2026-12-01T03:00:00.000Z");
    expect(fin.toISOString()).toBe("2027-01-01T03:00:00.000Z");
  });
});

describe("fmtDiaNumeroMes (día, número y mes para leer de un vistazo)", () => {
  it("formatea como 'Vie 24 jul', con el día de la semana capitalizado", () => {
    expect(fmtDiaNumeroMes(new Date("2026-07-24T00:00:00Z"))).toBe("Vie 24 jul");
  });

  it("no se corre de día por zona horaria", () => {
    // Si se formateara en hora argentina, 01/08 daría "Vie 31 jul".
    expect(fmtDiaNumeroMes(new Date("2026-08-01T00:00:00Z"))).toBe("Sáb 1 ago");
  });

  it("no rellena el día con cero (se lee más rápido)", () => {
    expect(fmtDiaNumeroMes(new Date("2026-07-05T00:00:00Z"))).toBe("Dom 5 jul");
  });

  it("no deja puntos ni comas del formato de es-AR", () => {
    expect(fmtDiaNumeroMes(new Date("2026-09-07T00:00:00Z"))).not.toMatch(/[.,]/);
  });
});

describe("fmtFechaInput (fecha 'día' → valor de <input type='date'>)", () => {
  it("devuelve aaaa-mm-dd", () => {
    expect(fmtFechaInput(new Date("2026-07-24T00:00:00Z"))).toBe("2026-07-24");
  });

  it("no se corre al día anterior", () => {
    expect(fmtFechaInput(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01");
  });
});

describe("horaArgentina", () => {
  it("convierte el instante a la hora de Argentina (UTC-3)", () => {
    // 01:30 UTC = 22:30 del día anterior en Argentina.
    expect(horaArgentina(new Date("2026-07-24T01:30:00Z"))).toBe(22);
  });

  it("devuelve 0 a la medianoche argentina, no 24", () => {
    expect(horaArgentina(new Date("2026-07-24T03:00:00Z"))).toBe(0);
  });

  it("devuelve un número entre 0 y 23 sin argumentos", () => {
    const hora = horaArgentina();
    expect(hora).toBeGreaterThanOrEqual(0);
    expect(hora).toBeLessThanOrEqual(23);
  });
});

describe("diasHasta (días de calendario desde hoy AR)", () => {
  const HOY = { y: 2026, m: 7, d: 31 };

  it("es 0 para hoy", () => {
    expect(diasHasta(new Date("2026-07-31T00:00:00Z"), HOY)).toBe(0);
  });

  it("es 1 para mañana, incluso cruzando de mes", () => {
    expect(diasHasta(new Date("2026-08-01T00:00:00Z"), HOY)).toBe(1);
  });

  it("cuenta los días cruzando meses", () => {
    expect(diasHasta(new Date("2026-08-10T00:00:00Z"), HOY)).toBe(10);
  });

  it("es negativo para una fecha pasada (guardia de anoche en curso)", () => {
    expect(diasHasta(new Date("2026-07-30T00:00:00Z"), HOY)).toBe(-1);
  });

  it("cuenta los días cruzando de año", () => {
    expect(
      diasHasta(new Date("2027-01-01T00:00:00Z"), { y: 2026, m: 12, d: 31 }),
    ).toBe(1);
  });
});
