import { describe, expect, it } from "vitest";
import { campoEmail, normalizarEmail } from "./email";

describe("normalizarEmail (S4)", () => {
  it("saca los espacios de alrededor", () => {
    expect(normalizarEmail("  juan@x.com  ")).toBe("juan@x.com");
  });

  it("pasa todo a minúsculas", () => {
    expect(normalizarEmail("Juan.Perez@Gmail.COM")).toBe(
      "juan.perez@gmail.com",
    );
  });

  it("deja igual un email que ya está normalizado", () => {
    expect(normalizarEmail("juan@x.com")).toBe("juan@x.com");
  });
});

describe("campoEmail (S4)", () => {
  it("normaliza antes de validar: acepta espacios y mayúsculas", () => {
    const r = campoEmail.safeParse("  Juan.Perez@X.COM ");
    expect(r.success).toBe(true);
    expect(r.success && r.data).toBe("juan.perez@x.com");
  });

  it("rechaza algo que no es un email", () => {
    const r = campoEmail.safeParse("no-es-un-email");
    expect(r.success).toBe(false);
    expect(!r.success && r.error.issues[0]?.message).toBe(
      "Ingresá un email válido.",
    );
  });

  it("rechaza un email sin dominio", () => {
    expect(campoEmail.safeParse("juan@").success).toBe(false);
  });

  it("rechaza el vacío", () => {
    expect(campoEmail.safeParse("   ").success).toBe(false);
  });
});
