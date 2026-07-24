import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  ctxEncargadoInterno,
  ctxMiembroAreaA,
  formDataDe,
  REDIRECT_ERROR,
} from "./_testutils";

// Mismo criterio de mocking que server/tareas.test.ts: se simulan prisma,
// auth y next/* para poder ejercitar las Server Actions sin DB ni request
// real.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    guardia: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    guardiaParticipante: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    intercambioGuardia: { create: vi.fn() },
    usuario: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({ getContextoAuth: vi.fn() }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error(REDIRECT_ERROR);
  }),
}));

import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { cederGuardia, crearGuardia, editarGuardia, eliminarGuardia } from "./guardias";

const db = prisma as unknown as {
  guardia: { findFirst: Mock; create: Mock; update: Mock; deleteMany: Mock };
  guardiaParticipante: { deleteMany: Mock; create: Mock; createMany: Mock };
  intercambioGuardia: { create: Mock };
  usuario: { findMany: Mock; findUnique: Mock; findFirst: Mock };
  $transaction: Mock;
};

const mockGetContexto = getContextoAuth as Mock;

function guardiaDe(overrides: Record<string, unknown> = {}) {
  return {
    id: "g1",
    destacamentoId: "d1",
    tipo: "INTERNA",
    fecha: new Date("2026-07-24T00:00:00Z"),
    cuarteleroNombre: null,
    participantes: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // $transaction en guardias.ts se usa siempre en estilo callback: se le
  // pasa el mock de prisma como "tx" (mismos métodos, alcanza para lo que
  // testeamos acá).
  db.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(db));
});

describe("crearGuardia", () => {
  const formInterna = formDataDe({
    tipo: "INTERNA",
    fecha: "2026-08-01",
    participantes: ["u2"],
  });

  it("sin permiso (no conducción): no crea la guardia", async () => {
    mockGetContexto.mockResolvedValue(ctxMiembroAreaA);

    const res = await crearGuardia(null, formInterna);

    expect(res).toEqual({ error: "No tenés permisos para armar guardias." });
    expect(db.guardia.create).not.toHaveBeenCalled();
  });

  it("cuartelero sin nombre: rechazada", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);

    const res = await crearGuardia(
      null,
      formDataDe({ tipo: "CUARTELERO", fecha: "2026-08-01" }),
    );

    expect(res).toEqual({ error: "Ingresá el nombre del cuartelero." });
    expect(db.guardia.create).not.toHaveBeenCalled();
  });

  it("interna sin participantes válidos del destacamento: rechazada", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.usuario.findMany.mockResolvedValue([]);

    const res = await crearGuardia(null, formInterna);

    expect(res).toEqual({ error: "Elegí al menos un bombero para la guardia interna." });
    expect(db.guardia.create).not.toHaveBeenCalled();
  });

  it("conducción crea una guardia interna válida y redirige al mes", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.usuario.findMany.mockResolvedValue([{ id: "u2" }]);
    db.guardia.create.mockResolvedValue(guardiaDe());

    await expect(crearGuardia(null, formInterna)).rejects.toThrow(REDIRECT_ERROR);

    expect(db.guardia.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          destacamentoId: "d1",
          tipo: "INTERNA",
          participantes: { create: [{ usuarioId: "u2" }] },
        }),
      }),
    );
  });
});

describe("editarGuardia", () => {
  const formEditar = formDataDe({
    guardiaId: "g1",
    fecha: "2026-08-02",
    participantes: ["u2"],
  });

  it("sin permiso: no actualiza", async () => {
    mockGetContexto.mockResolvedValue(ctxMiembroAreaA);

    const res = await editarGuardia(null, formEditar);

    expect(res).toEqual({ error: "No tenés permisos para editar guardias." });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("guardia inexistente/de otro destacamento: no actualiza", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.guardia.findFirst.mockResolvedValue(null);

    const res = await editarGuardia(null, formEditar);

    expect(res).toEqual({ error: "Guardia no encontrada." });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("interna sin participantes válidos: rechazada", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.guardia.findFirst.mockResolvedValue(guardiaDe());
    db.usuario.findMany.mockResolvedValue([]);

    const res = await editarGuardia(null, formEditar);

    expect(res).toEqual({ error: "Elegí al menos un bombero para la guardia interna." });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("conducción edita una guardia interna: actualiza y reemplaza participantes", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.guardia.findFirst.mockResolvedValue(guardiaDe());
    db.usuario.findMany.mockResolvedValue([{ id: "u2" }]);

    await expect(editarGuardia(null, formEditar)).rejects.toThrow(REDIRECT_ERROR);

    expect(db.$transaction).toHaveBeenCalled();
    expect(db.guardiaParticipante.deleteMany).toHaveBeenCalledWith({
      where: { guardiaId: "g1" },
    });
    expect(db.guardiaParticipante.createMany).toHaveBeenCalledWith({
      data: [{ guardiaId: "g1", usuarioId: "u2" }],
    });
  });
});

describe("cederGuardia", () => {
  it("quien cede no es participante de la guardia: no hace la transacción", async () => {
    mockGetContexto.mockResolvedValue({ usuarioId: "u1", destacamentoId: "d1", roles: [] });
    db.guardia.findFirst.mockResolvedValue(
      guardiaDe({ participantes: [{ usuarioId: "otro-usuario" }] }),
    );

    await cederGuardia(formDataDe({ guardiaId: "g1", aUsuarioId: "u3" }));

    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("ceder a uno mismo: no hace nada (corta antes de buscar la guardia)", async () => {
    mockGetContexto.mockResolvedValue({ usuarioId: "u1", destacamentoId: "d1", roles: [] });

    await cederGuardia(formDataDe({ guardiaId: "g1", aUsuarioId: "u1" }));

    expect(db.guardia.findFirst).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("destino inexistente en el destacamento: no hace la transacción", async () => {
    mockGetContexto.mockResolvedValue({ usuarioId: "u1", destacamentoId: "d1", roles: [] });
    db.guardia.findFirst.mockResolvedValue(
      guardiaDe({ participantes: [{ usuarioId: "u1" }] }),
    );
    db.usuario.findUnique.mockResolvedValue({ nombre: "Ana", apellido: "Pérez" });
    db.usuario.findFirst.mockResolvedValue(null);

    await cederGuardia(formDataDe({ guardiaId: "g1", aUsuarioId: "u3" }));

    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("participante cede su lugar a otro bombero del destacamento: transacción y registro del intercambio", async () => {
    mockGetContexto.mockResolvedValue({ usuarioId: "u1", destacamentoId: "d1", roles: [] });
    db.guardia.findFirst.mockResolvedValue(
      guardiaDe({ participantes: [{ usuarioId: "u1" }] }),
    );
    db.usuario.findUnique.mockResolvedValue({ nombre: "Ana", apellido: "Pérez" });
    db.usuario.findFirst.mockResolvedValue({ nombre: "Luis", apellido: "Gómez" });

    await cederGuardia(formDataDe({ guardiaId: "g1", aUsuarioId: "u3" }));

    expect(db.guardiaParticipante.deleteMany).toHaveBeenCalledWith({
      where: { guardiaId: "g1", usuarioId: "u1" },
    });
    expect(db.guardiaParticipante.create).toHaveBeenCalledWith({
      data: { guardiaId: "g1", usuarioId: "u3" },
    });
    expect(db.intercambioGuardia.create).toHaveBeenCalledWith({
      data: {
        guardiaId: "g1",
        deUsuarioId: "u1",
        aUsuarioId: "u3",
        deNombre: "Pérez, Ana",
        aNombre: "Gómez, Luis",
      },
    });
  });
});

describe("eliminarGuardia", () => {
  it("sin permiso: redirige sin borrar", async () => {
    mockGetContexto.mockResolvedValue(ctxMiembroAreaA);

    await expect(eliminarGuardia(formDataDe({ guardiaId: "g1" }))).rejects.toThrow(
      REDIRECT_ERROR,
    );

    expect(db.guardia.deleteMany).not.toHaveBeenCalled();
  });

  it("conducción borra la guardia del propio destacamento", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);

    await eliminarGuardia(formDataDe({ guardiaId: "g1" }));

    expect(db.guardia.deleteMany).toHaveBeenCalledWith({
      where: { id: "g1", destacamentoId: "d1" },
    });
  });
});
