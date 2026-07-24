import { describe, expect, it } from "vitest";
import { generarActivacion, hashToken, passwordAleatoria } from "@/lib/activacion";

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
