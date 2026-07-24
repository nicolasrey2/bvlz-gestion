import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  AREA_A,
  AREA_B,
  ctxCon,
  ctxEncargadoAreaA,
  ctxEncargadoInterno,
  ctxMiembroAreaA,
  ctxSubEncargado,
  formDataDe,
  REDIRECT_ERROR,
} from "./_testutils";

// Mocks de las dependencias externas de server/tareas.ts. Se definen ANTES de
// importar el módulo bajo prueba (vi.mock se hoistea, pero mantenemos el
// orden para que quede claro qué se está simulando).
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tarea: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tareaAsignado: { deleteMany: vi.fn(), createMany: vi.fn() },
    tareaComentario: { create: vi.fn() },
    tareaAdjunto: { create: vi.fn() },
    usuario: { findMany: vi.fn() },
    area: { findFirst: vi.fn() },
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

// subirEvidencia usa el cliente admin de Supabase; no se ejercita en detalle
// acá (requeriría simular Storage), pero se mockea para que el módulo cargue
// y para poder probar el corte por permisos antes de llegar al upload.
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import {
  aprobarTarea,
  comentar,
  crearTarea,
  editarTarea,
  eliminarTarea,
  enviarARevision,
  rechazarTarea,
  reasignarTarea,
} from "./tareas";

// Cast liviano: el mock solo expone los métodos que usan las actions, no la
// forma completa (y muy genérica) del PrismaClient real.
const db = prisma as unknown as {
  tarea: {
    findFirst: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
  };
  tareaAsignado: { deleteMany: Mock; createMany: Mock };
  tareaComentario: { create: Mock };
  usuario: { findMany: Mock };
  area: { findFirst: Mock };
  $transaction: Mock;
};

const mockGetContexto = getContextoAuth as Mock;

// Tarea base "cargada" por cargarTarea (findFirst con include asignados).
function tareaDe(overrides: Record<string, unknown> = {}) {
  return {
    id: "t1",
    destacamentoId: "d1",
    areaId: AREA_A,
    estado: "PENDIENTE",
    creadorId: "creador-1",
    asignados: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // $transaction: soporta tanto el estilo array (reasignarTarea) como el
  // callback (no usado en tareas.ts, pero sin costo dejarlo genérico).
  db.$transaction.mockImplementation(async (arg: unknown) => {
    if (typeof arg === "function") return (arg as (tx: unknown) => unknown)(db);
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg;
  });
});

describe("crearTarea", () => {
  it("sin sesión: devuelve error y no crea nada", async () => {
    mockGetContexto.mockResolvedValue(null);
    const res = await crearTarea(null, formDataDe({ titulo: "x", prioridad: "ALTA" }));
    expect(res).toEqual({ error: "Sesión no válida." });
    expect(db.tarea.create).not.toHaveBeenCalled();
  });

  it("miembro sin rol de conducción/área: permiso denegado", async () => {
    mockGetContexto.mockResolvedValue(ctxMiembroAreaA);
    const res = await crearTarea(null, formDataDe({ titulo: "x", prioridad: "ALTA" }));
    expect(res).toEqual({ error: "No tenés permisos para crear tareas." });
    expect(db.tarea.create).not.toHaveBeenCalled();
  });

  it("encargado de área intentando crear en otra área: rechazado", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoAreaA);
    db.area.findFirst.mockResolvedValue({ id: AREA_B, destacamentoId: "d1" });

    const res = await crearTarea(
      null,
      formDataDe({ titulo: "x", prioridad: "ALTA", areaId: AREA_B }),
    );

    expect(res).toEqual({ error: "No podés crear tareas en esa área." });
    expect(db.tarea.create).not.toHaveBeenCalled();
  });

  it("área inexistente en el destacamento: rechazada antes de chequear permiso de área", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.area.findFirst.mockResolvedValue(null);

    const res = await crearTarea(
      null,
      formDataDe({ titulo: "x", prioridad: "ALTA", areaId: "area-inexistente" }),
    );

    expect(res).toEqual({ error: "El área seleccionada no es válida." });
    expect(db.tarea.create).not.toHaveBeenCalled();
  });

  it("conducción crea una tarea general (sin área) y redirige", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.usuario.findMany.mockResolvedValue([{ id: "asig-1" }]);
    db.tarea.create.mockResolvedValue(tareaDe());

    await expect(
      crearTarea(
        null,
        formDataDe({
          titulo: "Revisar matafuegos",
          prioridad: "MEDIA",
          asignados: ["asig-1"],
        }),
      ),
    ).rejects.toThrow(REDIRECT_ERROR);

    expect(db.tarea.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          titulo: "Revisar matafuegos",
          prioridad: "MEDIA",
          areaId: null,
          destacamentoId: "d1",
          creadorId: "u1",
        }),
      }),
    );
  });
});

describe("editarTarea", () => {
  const formEditar = formDataDe({
    tareaId: "t1",
    titulo: "Nuevo título",
    prioridad: "ALTA",
  });

  it("tarea inexistente/de otro destacamento: no actualiza", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.tarea.findFirst.mockResolvedValue(null);

    const res = await editarTarea(null, formEditar);

    expect(res).toEqual({ error: "La tarea no existe." });
    expect(db.tarea.update).not.toHaveBeenCalled();
  });

  it("tarea COMPLETA: no se puede editar", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ estado: "COMPLETA" }));

    const res = await editarTarea(null, formEditar);

    expect(res).toEqual({ error: "Una tarea completa no se puede editar." });
    expect(db.tarea.update).not.toHaveBeenCalled();
  });

  it("encargado de otra área: permiso denegado", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoAreaA);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ areaId: AREA_B }));

    const res = await editarTarea(null, formEditar);

    expect(res).toEqual({ error: "No tenés permisos para editar esta tarea." });
    expect(db.tarea.update).not.toHaveBeenCalled();
  });

  it("conducción edita una tarea de cualquier área y redirige", async () => {
    mockGetContexto.mockResolvedValue(ctxSubEncargado);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ estado: "PENDIENTE" }));

    await expect(editarTarea(null, formEditar)).rejects.toThrow(REDIRECT_ERROR);

    expect(db.tarea.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "t1" },
        data: expect.objectContaining({ titulo: "Nuevo título", prioridad: "ALTA" }),
      }),
    );
  });
});

describe("eliminarTarea", () => {
  it("sin sesión: redirige a /login sin tocar la DB", async () => {
    mockGetContexto.mockResolvedValue(null);
    await expect(eliminarTarea(formDataDe({ tareaId: "t1" }))).rejects.toThrow(
      REDIRECT_ERROR,
    );
    expect(db.tarea.delete).not.toHaveBeenCalled();
  });

  it("tarea de otro destacamento (findFirst null): no borra", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.tarea.findFirst.mockResolvedValue(null);

    await eliminarTarea(formDataDe({ tareaId: "t1" }));

    expect(db.tarea.delete).not.toHaveBeenCalled();
  });

  it("miembro que no creó la tarea y no encarga el área: permiso denegado", async () => {
    mockGetContexto.mockResolvedValue(ctxMiembroAreaA);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ creadorId: "otro-usuario" }));

    await eliminarTarea(formDataDe({ tareaId: "t1" }));

    expect(db.tarea.delete).not.toHaveBeenCalled();
  });

  it("el creador de la tarea puede borrarla aunque no encargue el área", async () => {
    mockGetContexto.mockResolvedValue(ctxMiembroAreaA);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ areaId: AREA_B, creadorId: "u1" }));

    await expect(eliminarTarea(formDataDe({ tareaId: "t1" }))).rejects.toThrow(
      REDIRECT_ERROR,
    );

    expect(db.tarea.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
  });
});

describe("enviarARevision (PENDIENTE → EN_REVISION)", () => {
  it("tarea que no está PENDIENTE: no transiciona", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ estado: "EN_REVISION" }));

    await enviarARevision(formDataDe({ tareaId: "t1" }));

    expect(db.tarea.update).not.toHaveBeenCalled();
  });

  it("miembro sin asignación ni rol de conducción/área: permiso denegado", async () => {
    mockGetContexto.mockResolvedValue(ctxCon([{ rol: "MIEMBRO", areaId: AREA_B }]));
    db.tarea.findFirst.mockResolvedValue(
      tareaDe({ estado: "PENDIENTE", areaId: AREA_A, asignados: [{ usuarioId: "otro" }] }),
    );

    await enviarARevision(formDataDe({ tareaId: "t1" }));

    expect(db.tarea.update).not.toHaveBeenCalled();
  });

  it("un asignado puede enviar su propia tarea a revisión", async () => {
    mockGetContexto.mockResolvedValue(ctxMiembroAreaA);
    db.tarea.findFirst.mockResolvedValue(
      tareaDe({ estado: "PENDIENTE", asignados: [{ usuarioId: "u1" }] }),
    );

    await enviarARevision(formDataDe({ tareaId: "t1" }));

    expect(db.tarea.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { estado: "EN_REVISION" },
    });
  });
});

describe("aprobarTarea (EN_REVISION → COMPLETA)", () => {
  it("tarea que no está EN_REVISION: no aprueba", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ estado: "PENDIENTE" }));

    await aprobarTarea(formDataDe({ tareaId: "t1" }));

    expect(db.tarea.update).not.toHaveBeenCalled();
  });

  it("quien no puede aprobar el área (miembro): no aprueba", async () => {
    mockGetContexto.mockResolvedValue(ctxMiembroAreaA);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ estado: "EN_REVISION" }));

    await aprobarTarea(formDataDe({ tareaId: "t1" }));

    expect(db.tarea.update).not.toHaveBeenCalled();
  });

  it("encargado de otra área: no puede aprobar", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoAreaA);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ estado: "EN_REVISION", areaId: AREA_B }));

    await aprobarTarea(formDataDe({ tareaId: "t1" }));

    expect(db.tarea.update).not.toHaveBeenCalled();
  });

  it("conducción aprueba una tarea EN_REVISION del destacamento: transición válida a COMPLETA", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ estado: "EN_REVISION" }));

    await aprobarTarea(formDataDe({ tareaId: "t1" }));

    expect(db.tarea.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: {
        estado: "COMPLETA",
        aprobadorId: "u1",
        aprobadaEn: expect.any(Date),
      },
    });
  });

  it("encargado del área correcta también puede aprobar", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoAreaA);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ estado: "EN_REVISION", areaId: AREA_A }));

    await aprobarTarea(formDataDe({ tareaId: "t1" }));

    expect(db.tarea.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: "COMPLETA" }) }),
    );
  });
});

describe("rechazarTarea (EN_REVISION → PENDIENTE)", () => {
  it("tarea que no está EN_REVISION: no rechaza", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ estado: "COMPLETA" }));

    await rechazarTarea(formDataDe({ tareaId: "t1" }));

    expect(db.tarea.update).not.toHaveBeenCalled();
  });

  it("sin permiso de aprobar el área: no rechaza", async () => {
    mockGetContexto.mockResolvedValue(ctxMiembroAreaA);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ estado: "EN_REVISION" }));

    await rechazarTarea(formDataDe({ tareaId: "t1" }));

    expect(db.tarea.update).not.toHaveBeenCalled();
  });

  it("conducción rechaza y vuelve la tarea a PENDIENTE, limpiando aprobador", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ estado: "EN_REVISION" }));

    await rechazarTarea(formDataDe({ tareaId: "t1" }));

    expect(db.tarea.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { estado: "PENDIENTE", aprobadorId: null, aprobadaEn: null },
    });
  });
});

describe("reasignarTarea", () => {
  it("sin permiso en el área de la tarea: no toca la transacción", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoAreaA);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ areaId: AREA_B }));

    await reasignarTarea(formDataDe({ tareaId: "t1", asignados: ["u2"] }));

    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("con permiso: reemplaza el conjunto de asignados en una transacción", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoAreaA);
    db.tarea.findFirst.mockResolvedValue(tareaDe({ areaId: AREA_A }));
    db.usuario.findMany.mockResolvedValue([{ id: "u2" }]);

    await reasignarTarea(formDataDe({ tareaId: "t1", asignados: ["u2"] }));

    expect(db.$transaction).toHaveBeenCalled();
  });
});

describe("comentar", () => {
  it("usuario sin acceso a la tarea (ni asignado, ni creador, ni conducción/área): no comenta", async () => {
    mockGetContexto.mockResolvedValue(ctxCon([{ rol: "MIEMBRO", areaId: AREA_B }]));
    db.tarea.findFirst.mockResolvedValue(
      tareaDe({ areaId: AREA_A, creadorId: "otro", asignados: [] }),
    );

    await comentar(formDataDe({ tareaId: "t1", texto: "hola" }));

    expect(db.tareaComentario.create).not.toHaveBeenCalled();
  });

  it("un asignado puede comentar", async () => {
    mockGetContexto.mockResolvedValue(ctxMiembroAreaA);
    db.tarea.findFirst.mockResolvedValue(
      tareaDe({ creadorId: "otro", asignados: [{ usuarioId: "u1" }] }),
    );

    await comentar(formDataDe({ tareaId: "t1", texto: "avance" }));

    expect(db.tareaComentario.create).toHaveBeenCalledWith({
      data: { tareaId: "t1", autorId: "u1", texto: "avance" },
    });
  });

  it("texto vacío: no comenta (ni siquiera busca la tarea)", async () => {
    mockGetContexto.mockResolvedValue(ctxEncargadoInterno);

    await comentar(formDataDe({ tareaId: "t1", texto: "   " }));

    expect(db.tarea.findFirst).not.toHaveBeenCalled();
    expect(db.tareaComentario.create).not.toHaveBeenCalled();
  });
});
