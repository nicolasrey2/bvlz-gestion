import type {
  Rango,
  RolTipo,
  Prioridad,
  EstadoTarea,
  TipoGuardia,
  TipoFichada,
  TipoNovedad,
  TipoSiniestro,
  EstadoParte,
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

// --- Guardias ----------------------------------------------------------------

export const NOMBRE_TIPO_GUARDIA: Record<TipoGuardia, string> = {
  INTERNA: "Interna",
  CUARTELERO: "Cuartelero",
};

/// Horario según el tipo de guardia (PRD §4.4).
export function horarioGuardia(tipo: TipoGuardia): string {
  return tipo === "INTERNA" ? "22:00 a 08:00" : "07:00 a 07:00 (24 hs)";
}

// --- Fichado ----------------------------------------------------------------

export const NOMBRE_TIPO_FICHADA: Record<TipoFichada, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
};

// --- Cuaderno de novedades ---------------------------------------------------

export const NOMBRE_TIPO_NOVEDAD: Record<TipoNovedad, string> = {
  ROTURA: "Rotura / daño",
  FALTANTE: "Faltante de material",
  EDILICIO: "Edilicio",
  OBSERVACION: "Observación",
  OTRO: "Otro",
};

export const TIPOS_NOVEDAD: { value: TipoNovedad; label: string }[] = (
  Object.keys(NOMBRE_TIPO_NOVEDAD) as TipoNovedad[]
).map((value) => ({ value, label: NOMBRE_TIPO_NOVEDAD[value] }));

// --- Partes de intervención --------------------------------------------------

export const NOMBRE_TIPO_SINIESTRO: Record<TipoSiniestro, string> = {
  INCENDIO: "Incendio",
  RESCATE: "Rescate",
  ACCIDENTE_VIAL: "Accidente vial",
  FUGA_GAS: "Fuga de gas",
  RESCATE_ANIMAL: "Rescate de animal",
  FERROVIARIO: "Siniestro ferroviario",
  OTRO: "Otro",
};

export const TIPOS_SINIESTRO: { value: TipoSiniestro; label: string }[] = (
  Object.keys(NOMBRE_TIPO_SINIESTRO) as TipoSiniestro[]
).map((value) => ({ value, label: NOMBRE_TIPO_SINIESTRO[value] }));

export const NOMBRE_ESTADO_PARTE: Record<EstadoParte, string> = {
  ABIERTO: "Abierto",
  CERRADO: "Cerrado",
};
