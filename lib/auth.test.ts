import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// Mocks de las dependencias externas de lib/auth.ts: la sesión de Supabase y
// la DB. Se define el usuario de Auth y la fila de Usuario por test.
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { getUser } })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { usuario: { findUnique: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { getUsuarioActual, getUsuarioVinculado } from "./auth";

const db = prisma as unknown as { usuario: { findUnique: Mock } };

/// Fila de Usuario mínima para estos tests (solo lo que mira lib/auth).
function usuarioDe(activo: boolean) {
  return {
    id: "u1",
    authId: "auth-1",
    destacamentoId: "d1",
    activo,
    asignaciones: [{ rol: "MIEMBRO", areaId: null, area: null }],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "auth-1" } } });
});

describe("getUsuarioActual — S1: la baja lógica corta el acceso", () => {
  it("devuelve el usuario si está activo", async () => {
    db.usuario.findUnique.mockResolvedValue(usuarioDe(true));
    const usuario = await getUsuarioActual();
    expect(usuario).not.toBeNull();
    expect(usuario?.id).toBe("u1");
  });

  it("devuelve null si el usuario está dado de baja", async () => {
    db.usuario.findUnique.mockResolvedValue(usuarioDe(false));
    expect(await getUsuarioActual()).toBeNull();
  });

  it("devuelve null si no hay sesión de Supabase", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect(await getUsuarioActual()).toBeNull();
    // Ni siquiera consulta la DB si no hay sesión.
    expect(db.usuario.findUnique).not.toHaveBeenCalled();
  });

  it("devuelve null si la cuenta de Auth no está vinculada a un Usuario", async () => {
    db.usuario.findUnique.mockResolvedValue(null);
    expect(await getUsuarioActual()).toBeNull();
  });
});

describe("getUsuarioVinculado — no filtra por estado", () => {
  it("devuelve el usuario aunque esté dado de baja (la home lo necesita para distinguir el caso)", async () => {
    db.usuario.findUnique.mockResolvedValue(usuarioDe(false));
    const usuario = await getUsuarioVinculado();
    expect(usuario?.id).toBe("u1");
    expect(usuario?.activo).toBe(false);
  });

  it("devuelve null si no hay sesión", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect(await getUsuarioVinculado()).toBeNull();
  });
});
