import { describe, expect, it } from "vitest";
import type { RolTipo } from "@/generated/prisma/client";
import {
  alcanceVisibilidad,
  areasQueEncarga,
  esConduccion,
  puedeAprobarTareaEnArea,
  puedeCrearParte,
  puedeCrearTareaEnArea,
  puedeCrearTareas,
  puedeEditarParte,
  puedeFichar,
  puedeGestionarGuardias,
  puedeGestionarUsuarios,
  puedeReportarNovedad,
  puedeVerFichados,
  type ContextoAuth,
} from "@/lib/permisos";

// Helper para armar un ContextoAuth de prueba con roles arbitrarios.
function ctxCon(roles: { rol: RolTipo; areaId: string | null }[]): ContextoAuth {
  return { usuarioId: "u1", destacamentoId: "d1", roles };
}

const AREA_A = "area-a";
const AREA_B = "area-b";

const encargadoInterno = ctxCon([{ rol: "ENCARGADO_INTERNO", areaId: null }]);
const subEncargado = ctxCon([{ rol: "SUB_ENCARGADO", areaId: null }]);
const encargadoAreaA = ctxCon([{ rol: "ENCARGADO_AREA", areaId: AREA_A }]);
const miembroAreaA = ctxCon([{ rol: "MIEMBRO", areaId: AREA_A }]);
const sinRoles = ctxCon([]);

describe("esConduccion", () => {
  it("es true para encargado interno", () => {
    expect(esConduccion(encargadoInterno)).toBe(true);
  });

  it("es true para sub-encargado", () => {
    expect(esConduccion(subEncargado)).toBe(true);
  });

  it("es false para encargado de área", () => {
    expect(esConduccion(encargadoAreaA)).toBe(false);
  });

  it("es false para miembro", () => {
    expect(esConduccion(miembroAreaA)).toBe(false);
  });

  it("es false para usuario sin roles", () => {
    expect(esConduccion(sinRoles)).toBe(false);
  });

  it("es true si uno de los múltiples roles es de conducción", () => {
    const ctx = ctxCon([
      { rol: "ENCARGADO_AREA", areaId: AREA_A },
      { rol: "SUB_ENCARGADO", areaId: null },
    ]);
    expect(esConduccion(ctx)).toBe(true);
  });
});

describe("areasQueEncarga", () => {
  it("devuelve el área para un encargado de área", () => {
    expect(areasQueEncarga(encargadoAreaA)).toEqual([AREA_A]);
  });

  it("devuelve vacío para un miembro", () => {
    expect(areasQueEncarga(miembroAreaA)).toEqual([]);
  });

  it("devuelve vacío para conducción sin rol de área", () => {
    expect(areasQueEncarga(encargadoInterno)).toEqual([]);
  });

  it("devuelve todas las áreas cuando encarga varias", () => {
    const ctx = ctxCon([
      { rol: "ENCARGADO_AREA", areaId: AREA_A },
      { rol: "ENCARGADO_AREA", areaId: AREA_B },
    ]);
    expect(areasQueEncarga(ctx).sort()).toEqual([AREA_A, AREA_B].sort());
  });

  it("devuelve vacío para usuario sin roles", () => {
    expect(areasQueEncarga(sinRoles)).toEqual([]);
  });
});

describe("alcanceVisibilidad", () => {
  it("es DESTACAMENTO para encargado interno", () => {
    expect(alcanceVisibilidad(encargadoInterno)).toEqual({ tipo: "DESTACAMENTO" });
  });

  it("es DESTACAMENTO para sub-encargado", () => {
    expect(alcanceVisibilidad(subEncargado)).toEqual({ tipo: "DESTACAMENTO" });
  });

  it("es AREAS con las áreas que encarga para el encargado de área", () => {
    expect(alcanceVisibilidad(encargadoAreaA)).toEqual({
      tipo: "AREAS",
      areaIds: [AREA_A],
    });
  });

  it("es AREAS vacío para un miembro", () => {
    expect(alcanceVisibilidad(miembroAreaA)).toEqual({ tipo: "AREAS", areaIds: [] });
  });

  it("es AREAS vacío para usuario sin roles", () => {
    expect(alcanceVisibilidad(sinRoles)).toEqual({ tipo: "AREAS", areaIds: [] });
  });

  it("incluye varias áreas cuando el usuario encarga más de una", () => {
    const ctx = ctxCon([
      { rol: "ENCARGADO_AREA", areaId: AREA_A },
      { rol: "ENCARGADO_AREA", areaId: AREA_B },
    ]);
    expect(alcanceVisibilidad(ctx)).toEqual({
      tipo: "AREAS",
      areaIds: [AREA_A, AREA_B],
    });
  });
});

describe("puedeGestionarUsuarios", () => {
  it("permite a conducción", () => {
    expect(puedeGestionarUsuarios(encargadoInterno)).toBe(true);
    expect(puedeGestionarUsuarios(subEncargado)).toBe(true);
  });

  it("no permite a encargado de área ni miembro", () => {
    expect(puedeGestionarUsuarios(encargadoAreaA)).toBe(false);
    expect(puedeGestionarUsuarios(miembroAreaA)).toBe(false);
  });

  it("no permite a usuario sin roles", () => {
    expect(puedeGestionarUsuarios(sinRoles)).toBe(false);
  });
});

describe("puedeGestionarGuardias", () => {
  it("permite solo a conducción", () => {
    expect(puedeGestionarGuardias(encargadoInterno)).toBe(true);
    expect(puedeGestionarGuardias(subEncargado)).toBe(true);
    expect(puedeGestionarGuardias(encargadoAreaA)).toBe(false);
    expect(puedeGestionarGuardias(miembroAreaA)).toBe(false);
    expect(puedeGestionarGuardias(sinRoles)).toBe(false);
  });
});

describe("puedeVerFichados", () => {
  it("permite solo a conducción", () => {
    expect(puedeVerFichados(encargadoInterno)).toBe(true);
    expect(puedeVerFichados(subEncargado)).toBe(true);
    expect(puedeVerFichados(encargadoAreaA)).toBe(false);
    expect(puedeVerFichados(miembroAreaA)).toBe(false);
    expect(puedeVerFichados(sinRoles)).toBe(false);
  });
});

describe("puedeCrearTareas", () => {
  it("permite a conducción", () => {
    expect(puedeCrearTareas(encargadoInterno)).toBe(true);
    expect(puedeCrearTareas(subEncargado)).toBe(true);
  });

  it("permite a encargado de área", () => {
    expect(puedeCrearTareas(encargadoAreaA)).toBe(true);
  });

  it("no permite a miembro", () => {
    expect(puedeCrearTareas(miembroAreaA)).toBe(false);
  });

  it("no permite a usuario sin roles", () => {
    expect(puedeCrearTareas(sinRoles)).toBe(false);
  });
});

describe("puedeCrearTareaEnArea", () => {
  it("conducción puede en cualquier área", () => {
    expect(puedeCrearTareaEnArea(encargadoInterno, AREA_A)).toBe(true);
    expect(puedeCrearTareaEnArea(subEncargado, AREA_B)).toBe(true);
  });

  it("conducción puede en tareas generales (área null)", () => {
    expect(puedeCrearTareaEnArea(encargadoInterno, null)).toBe(true);
  });

  it("encargado de área puede solo en su propia área", () => {
    expect(puedeCrearTareaEnArea(encargadoAreaA, AREA_A)).toBe(true);
  });

  it("encargado de área NO puede en otra área", () => {
    expect(puedeCrearTareaEnArea(encargadoAreaA, AREA_B)).toBe(false);
  });

  it("encargado de área NO puede en tareas generales", () => {
    expect(puedeCrearTareaEnArea(encargadoAreaA, null)).toBe(false);
  });

  it("miembro nunca puede, ni en su área ni en general", () => {
    expect(puedeCrearTareaEnArea(miembroAreaA, AREA_A)).toBe(false);
    expect(puedeCrearTareaEnArea(miembroAreaA, null)).toBe(false);
  });

  it("usuario que encarga varias áreas puede en cualquiera de las suyas", () => {
    const ctx = ctxCon([
      { rol: "ENCARGADO_AREA", areaId: AREA_A },
      { rol: "ENCARGADO_AREA", areaId: AREA_B },
    ]);
    expect(puedeCrearTareaEnArea(ctx, AREA_A)).toBe(true);
    expect(puedeCrearTareaEnArea(ctx, AREA_B)).toBe(true);
  });
});

describe("puedeAprobarTareaEnArea", () => {
  it("conducción puede aprobar en cualquier área y en general", () => {
    expect(puedeAprobarTareaEnArea(encargadoInterno, AREA_A)).toBe(true);
    expect(puedeAprobarTareaEnArea(subEncargado, AREA_B)).toBe(true);
    expect(puedeAprobarTareaEnArea(encargadoInterno, null)).toBe(true);
  });

  it("encargado de área puede aprobar solo en la suya", () => {
    expect(puedeAprobarTareaEnArea(encargadoAreaA, AREA_A)).toBe(true);
    expect(puedeAprobarTareaEnArea(encargadoAreaA, AREA_B)).toBe(false);
    expect(puedeAprobarTareaEnArea(encargadoAreaA, null)).toBe(false);
  });

  it("miembro nunca puede aprobar", () => {
    expect(puedeAprobarTareaEnArea(miembroAreaA, AREA_A)).toBe(false);
    expect(puedeAprobarTareaEnArea(miembroAreaA, null)).toBe(false);
  });

  it("usuario que encarga varias áreas puede aprobar en cualquiera de las suyas", () => {
    const ctx = ctxCon([
      { rol: "ENCARGADO_AREA", areaId: AREA_A },
      { rol: "ENCARGADO_AREA", areaId: AREA_B },
    ]);
    expect(puedeAprobarTareaEnArea(ctx, AREA_A)).toBe(true);
    expect(puedeAprobarTareaEnArea(ctx, AREA_B)).toBe(true);
  });
});

describe("acciones abiertas a todo el destacamento", () => {
  const todos = [encargadoInterno, subEncargado, encargadoAreaA, miembroAreaA, sinRoles];

  it("puedeReportarNovedad es true para todos", () => {
    for (const ctx of todos) expect(puedeReportarNovedad(ctx)).toBe(true);
  });

  it("puedeCrearParte es true para todos", () => {
    for (const ctx of todos) expect(puedeCrearParte(ctx)).toBe(true);
  });

  it("puedeFichar es true para todos", () => {
    for (const ctx of todos) expect(puedeFichar(ctx)).toBe(true);
  });
});

describe("puedeEditarParte", () => {
  const abiertoPropio = { estado: "ABIERTO", creadorId: "u1" };
  const abiertoDeOtro = { estado: "ABIERTO", creadorId: "otro" };
  const cerradoPropio = { estado: "CERRADO", creadorId: "u1" };

  it("el creador puede editar su parte abierto", () => {
    expect(puedeEditarParte(miembroAreaA, abiertoPropio)).toBe(true);
  });

  it("la conducción puede editar el parte de otro", () => {
    expect(puedeEditarParte(encargadoInterno, abiertoDeOtro)).toBe(true);
  });

  it("un miembro no puede editar el parte de otro", () => {
    expect(puedeEditarParte(miembroAreaA, abiertoDeOtro)).toBe(false);
  });

  it("nadie puede editar un parte cerrado, ni su creador", () => {
    // El cierre es el punto en que el parte pasa a ser un registro formal.
    expect(puedeEditarParte(miembroAreaA, cerradoPropio)).toBe(false);
    expect(puedeEditarParte(encargadoInterno, cerradoPropio)).toBe(false);
  });
});
