import { describe, expect, it } from "vitest";
import {
  fmtDiaSemana,
  fmtFecha,
  fmtFechaDia,
  fmtFechaHora,
  fmtHora,
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
