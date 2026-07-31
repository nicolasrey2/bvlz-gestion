import { describe, expect, it } from "vitest";
import {
  estadoLink,
  generarActivacion,
  hashToken,
  passwordAleatoria,
} from "@/lib/activacion";

// Tolerancia para comparar el vencimiento sin acoplarse al tiempo exacto de
// ejecución del test.
const UN_MINUTO_MS = 60 * 1000;
const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

describe("hashToken", () => {
  it("es determinístico: el mismo input da siempre el mismo hash", () => {
    expect(hashToken("token-de-prueba")).toBe(hashToken("token-de-prueba"));
  });

  it("da hashes distintos para inputs distintos", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });

  it("devuelve un hash hexadecimal de 64 caracteres (SHA-256)", () => {
    const hash = hashToken("cualquier-cosa");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("generarActivacion", () => {
  it("devuelve un token no vacío", () => {
    const { token } = generarActivacion();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("el hash devuelto coincide con hashToken(token)", () => {
    const { token, hash } = generarActivacion();
    expect(hash).toBe(hashToken(token));
  });

  it("genera un token distinto en cada llamada", () => {
    const a = generarActivacion();
    const b = generarActivacion();
    expect(a.token).not.toBe(b.token);
  });

  it("expira aproximadamente 7 días en el futuro", () => {
    const antes = Date.now();
    const { expira } = generarActivacion();
    const despues = Date.now();

    expect(expira).toBeInstanceOf(Date);
    // El vencimiento debe caer dentro de los 7 días desde "antes" y "después"
    // de la llamada, con un margen chico de tolerancia.
    expect(expira.getTime()).toBeGreaterThanOrEqual(antes + SIETE_DIAS_MS - UN_MINUTO_MS);
    expect(expira.getTime()).toBeLessThanOrEqual(despues + SIETE_DIAS_MS + UN_MINUTO_MS);
  });
});

describe("passwordAleatoria", () => {
  it("devuelve una cadena de longitud razonable (no trivial)", () => {
    const password = passwordAleatoria();
    expect(typeof password).toBe("string");
    expect(password.length).toBeGreaterThanOrEqual(20);
  });

  it("solo usa caracteres base64url", () => {
    expect(passwordAleatoria()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("genera valores distintos en cada llamada (aleatoriedad)", () => {
    const a = passwordAleatoria();
    const b = passwordAleatoria();
    expect(a).not.toBe(b);
  });
});

describe("estadoLink", () => {
  const AHORA = new Date("2026-07-31T12:00:00.000Z");
  const MANANA = new Date("2026-08-01T12:00:00.000Z");
  const AYER = new Date("2026-07-30T12:00:00.000Z");

  it("es vigente si la cuenta está sin activar y el token no venció", () => {
    expect(
      estadoLink({ cuentaActivada: false, activacionExpira: MANANA }, AHORA),
    ).toBe("vigente");
  });

  it("es vencido si pasó la fecha de vencimiento", () => {
    expect(
      estadoLink({ cuentaActivada: false, activacionExpira: AYER }, AHORA),
    ).toBe("vencido");
  });

  it("es vencido justo en el instante del vencimiento (no se estira)", () => {
    expect(
      estadoLink({ cuentaActivada: false, activacionExpira: AHORA }, AHORA),
    ).toBe("vencido");
  });

  it("es vencido si quedó un token sin fecha de vencimiento", () => {
    expect(
      estadoLink({ cuentaActivada: false, activacionExpira: null }, AHORA),
    ).toBe("vencido");
  });

  it("es usado cuando no hay ningún usuario con ese token", () => {
    // El caso más común: la cuenta se activó, el hash se borró y la persona
    // vuelve a abrir su link de siempre. No es un link falso.
    expect(estadoLink(null, AHORA)).toBe("usado");
  });

  it("es usado si la cuenta ya está activada, aunque el token no haya vencido", () => {
    expect(
      estadoLink({ cuentaActivada: true, activacionExpira: MANANA }, AHORA),
    ).toBe("usado");
  });
});
