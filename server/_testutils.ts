import type { RolTipo } from "@/generated/prisma/client";
import type { ContextoAuth } from "@/lib/permisos";

/// Helper para armar un ContextoAuth de prueba con roles arbitrarios.
/// Mismo criterio que lib/permisos.test.ts (usuarioId/destacamentoId fijos,
/// roles variables por test).
export function ctxCon(
  roles: { rol: RolTipo; areaId: string | null }[],
  overrides: Partial<Pick<ContextoAuth, "usuarioId" | "destacamentoId">> = {},
): ContextoAuth {
  return {
    usuarioId: overrides.usuarioId ?? "u1",
    destacamentoId: overrides.destacamentoId ?? "d1",
    roles,
  };
}

export const AREA_A = "area-a";
export const AREA_B = "area-b";

export const ctxEncargadoInterno = ctxCon([{ rol: "ENCARGADO_INTERNO", areaId: null }]);
export const ctxSubEncargado = ctxCon([{ rol: "SUB_ENCARGADO", areaId: null }]);
export const ctxEncargadoAreaA = ctxCon([{ rol: "ENCARGADO_AREA", areaId: AREA_A }]);
export const ctxMiembroAreaA = ctxCon([{ rol: "MIEMBRO", areaId: AREA_A }]);
export const ctxSinRoles = ctxCon([]);

/// FormData a partir de un objeto plano. Los valores array se agregan como
/// múltiples entradas (equivalente a formData.getAll).
export function formDataDe(valores: Record<string, string | string[] | undefined>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(valores)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) fd.append(key, v);
    } else {
      fd.append(key, value);
    }
  }
  return fd;
}

/// Error que lanza el mock de `redirect` (next/navigation) — así los tests
/// pueden usar `expect(...).rejects.toThrow(REDIRECT_ERROR)` para las
/// funciones que redirigen al no tener sesión.
export const REDIRECT_ERROR = "REDIRECT";
