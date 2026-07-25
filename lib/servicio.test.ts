import { describe, expect, it } from "vitest";
import {
  calcularMinutos,
  enServicio,
  formatearHoras,
  VENTANA_SERVICIO_MS,
  type FichadaMin,
} from "@/lib/servicio";

// Helper para armar una fichada sin repetir el tipo del campo `momento`.
function f(tipo: "ENTRADA" | "SALIDA", iso: string): FichadaMin {
  return { tipo, momento: new Date(iso) };
}

describe("calcularMinutos", () => {
  it("devuelve 0 para una lista vacía", () => {
    expect(calcularMinutos([], new Date("2026-07-24T12:00:00Z"))).toBe(0);
  });

  it("calcula un par ENTRADA/SALIDA simple (22:00 → 08:00 = 600 min)", () => {
    const fichadas = [
      f("ENTRADA", "2026-07-23T22:00:00Z"),
      f("SALIDA", "2026-07-24T08:00:00Z"),
    ];
    expect(calcularMinutos(fichadas, new Date("2026-07-25T00:00:00Z"))).toBe(600);
  });

  it("suma varios pares ENTRADA/SALIDA", () => {
    const fichadas = [
      f("ENTRADA", "2026-07-23T08:00:00Z"),
      f("SALIDA", "2026-07-23T10:00:00Z"), // 120 min
      f("ENTRADA", "2026-07-23T12:00:00Z"),
      f("SALIDA", "2026-07-23T12:30:00Z"), // 30 min
    ];
    expect(calcularMinutos(fichadas, new Date("2026-07-24T00:00:00Z"))).toBe(150);
  });

  it("cuenta una ENTRADA abierta (sin SALIDA) hasta `hasta`", () => {
    const fichadas = [f("ENTRADA", "2026-07-23T22:00:00Z")];
    expect(calcularMinutos(fichadas, new Date("2026-07-24T01:00:00Z"))).toBe(180);
  });

  it("ignora una SALIDA sin ENTRADA previa", () => {
    const fichadas = [
      f("SALIDA", "2026-07-23T08:00:00Z"),
      f("ENTRADA", "2026-07-23T09:00:00Z"),
      f("SALIDA", "2026-07-23T10:00:00Z"),
    ];
    expect(calcularMinutos(fichadas, new Date("2026-07-24T00:00:00Z"))).toBe(60);
  });

  it("ordena fichadas desordenadas antes de calcular", () => {
    const fichadas = [
      f("SALIDA", "2026-07-23T10:00:00Z"),
      f("ENTRADA", "2026-07-23T09:00:00Z"),
    ];
    expect(calcularMinutos(fichadas, new Date("2026-07-24T00:00:00Z"))).toBe(60);
  });
});

describe("formatearHoras", () => {
  it('formatea 90 minutos como "1h 30m"', () => {
    expect(formatearHoras(90)).toBe("1h 30m");
  });

  it('formatea 0 minutos como "0h 0m"', () => {
    expect(formatearHoras(0)).toBe("0h 0m");
  });

  it("formatea minutos exactos sin resto", () => {
    expect(formatearHoras(120)).toBe("2h 0m");
  });

  it("formatea menos de una hora", () => {
    expect(formatearHoras(45)).toBe("0h 45m");
  });
});

describe("enServicio", () => {
  const ahora = new Date("2026-07-24T12:00:00Z");

  it("es true si la última fichada es una ENTRADA reciente", () => {
    const ultima = f("ENTRADA", "2026-07-24T10:00:00Z"); // 2 hs atrás
    expect(enServicio(ultima, ahora)).toBe(true);
  });

  it("es false si la última fichada es una SALIDA", () => {
    const ultima = f("SALIDA", "2026-07-24T10:00:00Z");
    expect(enServicio(ultima, ahora)).toBe(false);
  });

  it("es false si la última ENTRADA está fuera de la ventana de servicio", () => {
    const vieja = new Date(ahora.getTime() - VENTANA_SERVICIO_MS - 1000);
    const ultima = f("ENTRADA", vieja.toISOString());
    expect(enServicio(ultima, ahora)).toBe(false);
  });

  it("es false si no hay fichada (null)", () => {
    expect(enServicio(null, ahora)).toBe(false);
  });
});
