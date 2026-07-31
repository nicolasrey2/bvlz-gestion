import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { ctxEncargadoInterno, ctxMiembroAreaA, formDataDe } from "./_testutils";

// Mocks de las dependencias externas de server/personal.ts.
const { updateUserById, createUser, deleteUser } = vi.hoisted(() => ({
  updateUserById: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    usuario: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    area: { findFirst: vi.fn() },
    asignacionRol: { findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({ getContextoAuth: vi.fn() }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    auth: { admin: { updateUserById, createUser, deleteUser } },
  })),
}));

import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { cambiarEmail, crearUsuario } from "./personal";

const db = prisma as unknown as {
  usuario: { findFirst: Mock; create: Mock; update: Mock };
};
const ctxMock = getContextoAuth as unknown as Mock;

const USUARIO = {
  id: "u9",
  authId: "auth-9",
  email: "random-a8f3@ejemplo.com",
  destacamentoId: "d1",
};

/// findFirst se usa para dos cosas distintas en personal.ts: buscar el usuario
/// a editar (por id) y chequear si el email ya está ocupado (por email). Se
/// discrimina por la forma del `where` para no depender del orden de llamada.
function mockBusquedas({
  usuario = USUARIO as typeof USUARIO | null,
  ocupadoPor = null as { id: string } | null,
} = {}) {
  db.usuario.findFirst.mockImplementation(
    async ({ where }: { where: Record<string, unknown> }) =>
      where.email ? ocupadoPor : usuario,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  ctxMock.mockResolvedValue(ctxEncargadoInterno);
  updateUserById.mockResolvedValue({ error: null });
  db.usuario.update.mockResolvedValue({});
  mockBusquedas();
});

describe("cambiarEmail — permisos (P7)", () => {
  it("corta si no hay sesión", async () => {
    ctxMock.mockResolvedValue(null);
    const r = await cambiarEmail(
      null,
      formDataDe({ usuarioId: "u9", email: "nuevo@x.com" }),
    );
    expect(r).toEqual({ error: "Sesión no válida." });
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("corta si no es conducción", async () => {
    ctxMock.mockResolvedValue(ctxMiembroAreaA);
    const r = await cambiarEmail(
      null,
      formDataDe({ usuarioId: "u9", email: "nuevo@x.com" }),
    );
    expect(r).toEqual({ error: "No tenés permisos para cambiar el email." });
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("no encuentra un usuario de otro destacamento", async () => {
    mockBusquedas({ usuario: null });
    const r = await cambiarEmail(
      null,
      formDataDe({ usuarioId: "ajeno", email: "nuevo@x.com" }),
    );
    expect(r).toEqual({ error: "Usuario no encontrado." });
    expect(updateUserById).not.toHaveBeenCalled();
  });
});

describe("cambiarEmail — validación (P7 + S4)", () => {
  it("rechaza un email con formato inválido", async () => {
    const r = await cambiarEmail(
      null,
      formDataDe({ usuarioId: "u9", email: "no-es-email" }),
    );
    expect(r).toEqual({ error: "Ingresá un email válido." });
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("avisa si el email es el que ya tiene", async () => {
    const r = await cambiarEmail(
      null,
      formDataDe({ usuarioId: "u9", email: USUARIO.email }),
    );
    expect(r).toEqual({ error: "Ese ya es el email del usuario." });
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("rechaza un email que ya usa otro usuario (case-insensitive)", async () => {
    mockBusquedas({ ocupadoPor: { id: "otro" } });
    const r = await cambiarEmail(
      null,
      formDataDe({ usuarioId: "u9", email: "Ocupado@X.com" }),
    );
    expect(r).toEqual({ error: "Ya existe un usuario con ese email." });
    expect(updateUserById).not.toHaveBeenCalled();
  });
});

describe("cambiarEmail — camino feliz (P7)", () => {
  it("actualiza Supabase Auth y la tabla con el email normalizado", async () => {
    const r = await cambiarEmail(
      null,
      formDataDe({ usuarioId: "u9", email: "  Juan.Perez@Gmail.COM " }),
    );

    expect(r).toEqual({ ok: true });
    // Auth: es lo que la persona usa para entrar.
    expect(updateUserById).toHaveBeenCalledWith("auth-9", {
      email: "juan.perez@gmail.com",
      email_confirm: true,
    });
    // Tabla: mismo valor normalizado, los dos lados quedan iguales.
    expect(db.usuario.update).toHaveBeenCalledWith({
      where: { id: "u9" },
      data: { email: "juan.perez@gmail.com" },
    });
  });

  it("no toca la contraseña ni vuelve la cuenta a pendiente", async () => {
    await cambiarEmail(
      null,
      formDataDe({ usuarioId: "u9", email: "nuevo@x.com" }),
    );
    const [, payload] = updateUserById.mock.calls[0];
    expect(payload).not.toHaveProperty("password");
    const { data } = db.usuario.update.mock.calls[0][0];
    expect(data).not.toHaveProperty("cuentaActivada");
    expect(data).not.toHaveProperty("activacionTokenHash");
  });
});

describe("cambiarEmail — consistencia entre Auth y la tabla (P7)", () => {
  it("no toca la tabla si falla Supabase Auth", async () => {
    updateUserById.mockResolvedValue({ error: { message: "boom" } });
    const r = await cambiarEmail(
      null,
      formDataDe({ usuarioId: "u9", email: "nuevo@x.com" }),
    );
    expect(r).toEqual({ error: "No se pudo cambiar el email: boom" });
    expect(db.usuario.update).not.toHaveBeenCalled();
  });

  it("traduce el duplicado de Auth a un mensaje claro", async () => {
    updateUserById.mockResolvedValue({
      error: { message: "A user with this email address has already been registered" },
    });
    const r = await cambiarEmail(
      null,
      formDataDe({ usuarioId: "u9", email: "nuevo@x.com" }),
    );
    expect(r).toEqual({ error: "Ya existe un usuario con ese email." });
    expect(db.usuario.update).not.toHaveBeenCalled();
  });

  it("revierte el email en Auth si falla el guardado en la tabla", async () => {
    db.usuario.update.mockRejectedValue(new Error("db caída"));
    const r = await cambiarEmail(
      null,
      formDataDe({ usuarioId: "u9", email: "nuevo@x.com" }),
    );

    expect(r).toEqual({ error: "No se pudo guardar el email: db caída" });
    // Segunda llamada a Auth: vuelve al email viejo para no dejar a la persona
    // entrando con uno y la app mostrando otro.
    expect(updateUserById).toHaveBeenCalledTimes(2);
    expect(updateUserById).toHaveBeenLastCalledWith("auth-9", {
      email: USUARIO.email,
      email_confirm: true,
    });
  });
});

describe("crearUsuario — email (S4)", () => {
  const alta = {
    nombre: "Juan",
    apellido: "Pérez",
    rango: "BOMBERO",
    email: "  Juan.Perez@Gmail.COM ",
  };

  beforeEach(() => {
    mockBusquedas({ usuario: null });
    createUser.mockResolvedValue({ data: { user: { id: "auth-nuevo" } }, error: null });
    db.usuario.create.mockResolvedValue({});
  });

  it("normaliza el email a minúsculas en Auth y en la tabla", async () => {
    const r = await crearUsuario(null, formDataDe(alta));

    expect(r && "ok" in r && r.ok).toBe(true);
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "juan.perez@gmail.com" }),
    );
    const { data } = db.usuario.create.mock.calls[0][0];
    expect(data.email).toBe("juan.perez@gmail.com");
  });

  it("rechaza un email con formato inválido sin crear nada", async () => {
    const r = await crearUsuario(
      null,
      formDataDe({ ...alta, email: "juan.perez" }),
    );
    expect(r).toEqual({ error: "Ingresá un email válido." });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("corta antes de tocar Auth si el email ya existe (case-insensitive)", async () => {
    mockBusquedas({ usuario: null, ocupadoPor: { id: "otro" } });
    const r = await crearUsuario(null, formDataDe(alta));
    expect(r).toEqual({ error: "Ya existe un usuario con ese email." });
    expect(createUser).not.toHaveBeenCalled();
  });
});
