import { describe, expect, it } from "vitest";
import { distanciaMetros, estadoUbicacion } from "@/lib/geo";

describe("distanciaMetros", () => {
  it("devuelve 0 para el mismo punto", () => {
    expect(distanciaMetros(-34.7833, -58.4167, -34.7833, -58.4167)).toBe(0);
  });

  it("aproxima ~111 m para 0.001° de diferencia de latitud", () => {
    // 1° de latitud ≈ 111.32 km → 0.001° ≈ 111 m.
    const d = distanciaMetros(-34.7833, -58.4167, -34.7843, -58.4167);
    expect(d).toBeCloseTo(111, 0);
  });

  it("crece con la distancia (dos puntos lejanos > dos puntos cercanos)", () => {
    const cerca = distanciaMetros(-34.7833, -58.4167, -34.7843, -58.4167);
    const lejos = distanciaMetros(-34.7833, -58.4167, -34.6037, -58.3816); // CABA
    expect(lejos).toBeGreaterThan(cerca);
  });

  it("es simétrica (A→B es igual a B→A)", () => {
    const ab = distanciaMetros(-34.7833, -58.4167, -34.7843, -58.4200);
    const ba = distanciaMetros(-34.7843, -58.4200, -34.7833, -58.4167);
    expect(ab).toBeCloseTo(ba, 6);
  });
});

describe("estadoUbicacion", () => {
  it("sin ubicación: no compartió coords", () => {
    expect(
      estadoUbicacion({ latitud: null, distanciaM: null, ubicacionVerificada: false }),
    ).toBe("sin_ubicacion");
  });

  it("sin verificar: hay coords pero no se pudo calcular distancia (cuartel sin coords)", () => {
    expect(
      estadoUbicacion({ latitud: -34.78, distanciaM: null, ubicacionVerificada: false }),
    ).toBe("sin_verificar");
  });

  it("en el cuartel: verificada dentro del radio", () => {
    expect(
      estadoUbicacion({ latitud: -34.78, distanciaM: 50, ubicacionVerificada: true }),
    ).toBe("en_cuartel");
  });

  it("fuera: distancia calculada pero fuera del radio", () => {
    expect(
      estadoUbicacion({ latitud: -34.78, distanciaM: 800, ubicacionVerificada: false }),
    ).toBe("fuera");
  });
});
