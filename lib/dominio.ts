import type {
  Rango,
  RolTipo,
  Prioridad,
  EstadoTarea,
} from "@/generated/prisma/client";

/// Etiquetas legibles de los roles funcionales (para UI).
export const NOMBRE_ROL: Record<RolTipo, string> = {
  ENCARGADO_INTERNO: "Encargado Interno",
  SUB_ENCARGADO: "Sub-encargado",
  ENCARGADO_AREA: "Encargado de Área",
  MIEMBRO: "Miembro",
};

/// Roles que requieren un área asociada.
export const ROLES_DE_AREA: RolTipo[] = ["ENCARGADO_AREA", "MIEMBRO"];

/// Jerarquías institucionales, en orden de menor a mayor (PRD §3.1).
/// El orden del array ES la jerarquía; el índice sirve para comparar rangos.
export const RANGOS: { value: Rango; label: string }[] = [
  { value: "ASPIRANTE", label: "Aspirante" },
  { value: "BOMBERO", label: "Bombero" },
  { value: "CABO", label: "Cabo" },
  { value: "CABO_PRIMERO", label: "Cabo Primero" },
  { value: "SARGENTO", label: "Sargento" },
  { value: "SARGENTO_PRIMERO", label: "Sargento Primero" },
  { value: "SUBOFICIAL_PRINCIPAL", label: "Suboficial Principal" },
  { value: "SUBOFICIAL_MAYOR", label: "Suboficial Mayor" },
  { value: "OFICIAL_AYUDANTE", label: "Oficial Ayudante" },
  { value: "OFICIAL_INSPECTOR", label: "Oficial Inspector" },
  { value: "OFICIAL_PRINCIPAL", label: "Oficial Principal" },
  { value: "SUBCOMANDANTE", label: "Subcomandante" },
  { value: "COMANDANTE", label: "Comandante" },
  { value: "SEGUNDO_JEFE_CUERPO", label: "2do Jefe del Cuerpo" },
  { value: "JEFE_CUERPO", label: "Jefe del Cuerpo" },
];

const RANGO_LABEL = new Map(RANGOS.map((r) => [r.value, r.label]));

/// Etiqueta legible de un rango.
export function nombreRango(rango: Rango): string {
  return RANGO_LABEL.get(rango) ?? rango;
}

// --- Tareas ------------------------------------------------------------------

export const PRIORIDADES: { value: Prioridad; label: string }[] = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAJA", label: "Baja" },
];

export const NOMBRE_PRIORIDAD: Record<Prioridad, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

export const NOMBRE_ESTADO: Record<EstadoTarea, string> = {
  PENDIENTE: "Pendiente",
  EN_REVISION: "En revisión",
  COMPLETA: "Completa",
};

/// Clases de color por estado (para chips/badges en la UI).
export const COLOR_ESTADO: Record<EstadoTarea, string> = {
  PENDIENTE: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
  EN_REVISION: "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
  COMPLETA: "bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-100",
};
