import { describe, expect, it } from "vitest";
import { desdeParaProximaGuardia } from "./guardiasConsultas";

/// La guardia interna va de 22:00 a 08:00 del día siguiente, así que "la
/// próxima guardia" tiene que incluir la de anoche mientras siga en curso.
/// Los instantes están en UTC; Argentina es UTC-3 sin horario de verano.
describe("desdeParaProximaGuardia", () => {
  it("de día busca desde hoy", () => {
    // 15:00Z = 12:00 en Argentina del 31/07.
    expect(
      desdeParaProximaGuardia(new Date("2026-07-31T15:00:00Z")).toISOString(),
    ).toBe("2026-07-31T00:00:00.000Z");
  });

  it("a las 23:00, con la guardia empezando, busca desde hoy", () => {
    // 02:00Z del 01/08 = 23:00 del 31/07 en Argentina.
    expect(
      desdeParaProximaGuardia(new Date("2026-08-01T02:00:00Z")).toISOString(),
    ).toBe("2026-07-31T00:00:00.000Z");
  });

  it("a las 02:00 sigue incluyendo la guardia de ayer (está en curso)", () => {
    // 05:00Z del 01/08 = 02:00 del 01/08 en Argentina: la guardia del 31/07
    // termina a las 08:00, así que todavía cuenta.
    expect(
      desdeParaProximaGuardia(new Date("2026-08-01T05:00:00Z")).toISOString(),
    ).toBe("2026-07-31T00:00:00.000Z");
  });

  it("a las 08:00, ya terminada la guardia, busca desde hoy", () => {
    // 11:00Z = 08:00 en Argentina.
    expect(
      desdeParaProximaGuardia(new Date("2026-08-01T11:00:00Z")).toISOString(),
    ).toBe("2026-08-01T00:00:00.000Z");
  });

  it("de madrugada cruzando de mes toma el día anterior correcto", () => {
    // 04:00Z del 01/08 = 01:00 del 01/08 en Argentina → mira desde el 31/07.
    expect(
      desdeParaProximaGuardia(new Date("2026-08-01T04:00:00Z")).toISOString(),
    ).toBe("2026-07-31T00:00:00.000Z");
  });

  it("de madrugada cruzando de año toma el 31 de diciembre", () => {
    // 03:30Z del 01/01/2027 = 00:30 del 01/01/2027 en Argentina.
    expect(
      desdeParaProximaGuardia(new Date("2027-01-01T03:30:00Z")).toISOString(),
    ).toBe("2026-12-31T00:00:00.000Z");
  });
});
