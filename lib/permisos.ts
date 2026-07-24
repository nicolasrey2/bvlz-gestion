import type { RolTipo } from "@/generated/prisma/client";

/// Contexto de autorización de un usuario: sus roles funcionales vigentes.
/// Se arma a partir de las AsignacionRol con vigenteHasta = null.
/// La visibilidad y las acciones se derivan SOLO de este contexto — nunca de la UI.
export interface ContextoAuth {
  usuarioId: string;
  destacamentoId: string;
  /// Roles vigentes del usuario. areaId aplica a roles de área.
  roles: RolActivo[];
}

export interface RolActivo {
  rol: RolTipo;
  areaId: string | null;
}

// --- Predicados de rol -------------------------------------------------------

/// Conducción del destacamento. El sub-encargado puede asumir como encargado
/// si el titular se ausenta (PRD §3.2), por eso comparten permisos.
export function esConduccion(ctx: ContextoAuth): boolean {
  return ctx.roles.some(
    (r) => r.rol === "ENCARGADO_INTERNO" || r.rol === "SUB_ENCARGADO",
  );
}

/// true si el usuario es encargado del área indicada.
function esEncargadoDeArea(ctx: ContextoAuth, areaId: string | null): boolean {
  if (!areaId) return false;
  return ctx.roles.some((r) => r.rol === "ENCARGADO_AREA" && r.areaId === areaId);
}

/// IDs de las áreas donde el usuario es encargado.
export function areasQueEncarga(ctx: ContextoAuth): string[] {
  return ctx.roles
    .filter((r) => r.rol === "ENCARGADO_AREA" && r.areaId)
    .map((r) => r.areaId as string);
}

// --- Visibilidad -------------------------------------------------------------

/// Alcance de lo que el usuario puede ver. Conducción ve todo el destacamento;
/// el resto ve lo general del destacamento + sus áreas (ver PRD §3.5).
export type Alcance =
  | { tipo: "DESTACAMENTO" }
  | { tipo: "AREAS"; areaIds: string[] };

export function alcanceVisibilidad(ctx: ContextoAuth): Alcance {
  if (esConduccion(ctx)) return { tipo: "DESTACAMENTO" };
  return { tipo: "AREAS", areaIds: areasQueEncarga(ctx) };
}

// --- Acciones (matriz de permisos, PRD §3.5) --------------------------------

/// Alta/baja de usuarios y cambios de rango/rol/área. Solo conducción.
export function puedeGestionarUsuarios(ctx: ContextoAuth): boolean {
  return esConduccion(ctx);
}

/// Armar/editar el cronograma mensual de guardias. Lo hace Oficina (conducción).
export function puedeGestionarGuardias(ctx: ContextoAuth): boolean {
  return esConduccion(ctx);
}

/// Crear tareas. Conducción a cualquiera; encargado de área dentro de su área.
export function puedeCrearTareas(ctx: ContextoAuth): boolean {
  return esConduccion(ctx) || areasQueEncarga(ctx).length > 0;
}

/// Crear/asignar una tarea de un área dada (null = tarea general del dto).
/// Conducción puede en cualquier área y en las generales; el encargado de área
/// solo en la suya (incluye reasignar lo que recibió — PRD §3.5/§4.3).
export function puedeCrearTareaEnArea(
  ctx: ContextoAuth,
  areaId: string | null,
): boolean {
  if (esConduccion(ctx)) return true;
  return esEncargadoDeArea(ctx, areaId);
}

/// Dar el visto bueno (En revisión → Completa) de una tarea del área.
/// Conducción en cualquier área; encargado de área en la suya (PRD §4.3).
export function puedeAprobarTareaEnArea(
  ctx: ContextoAuth,
  areaId: string | null,
): boolean {
  return esConduccion(ctx) || esEncargadoDeArea(ctx, areaId);
}

/// Ver/controlar los fichados. Oficina y encargado, cualquiera de los dos.
export function puedeVerFichados(ctx: ContextoAuth): boolean {
  return esConduccion(ctx);
}

/// Reportar novedades: cualquiera del destacamento puede (PRD §4.6).
export function puedeReportarNovedad(_ctx: ContextoAuth): boolean {
  return true;
}

/// Crear parte de intervención: cualquiera puede (PRD §4.7).
export function puedeCrearParte(_ctx: ContextoAuth): boolean {
  return true;
}

/// Fichar entrada/salida: todos (PRD §4.5).
export function puedeFichar(_ctx: ContextoAuth): boolean {
  return true;
}
