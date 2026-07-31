import { z } from "zod";

/// Personal del parte de intervención (P6).
///
/// El formulario oficial tiene dos tablas separadas —PERSONAL QUE CONCURRIÓ y
/// PERSONAL EN EL CUARTEL— y, en la primera, tres columnas además del nombre:
/// **Ch.** (chofer: número del móvil que condujo), **G** (ya estaba de guardia)
/// y **BP** (busca persona: lo convocó el localizador del cuartel). Antes de P6
/// el dominio guardaba sólo un array de strings.

/// Una línea de la tabla de personal.
export type PersonaParte = {
  /// Lo que se imprime en la columna "Jerarquía y apellido".
  ///
  /// Es un **snapshot**: se guarda el texto resuelto, no sólo la referencia al
  /// usuario. Un parte es un documento que se archiva — si la persona asciende
  /// el mes que viene, el parte de hoy tiene que seguir diciendo el rango que
  /// tenía hoy.
  nombre: string;
  /// Usuario del sistema, cuando se eligió de las sugerencias. Sirve para
  /// trazabilidad; lo que se imprime siempre es `nombre`. Va vacío para los
  /// cuarteleros y para cualquiera que se cargue como texto libre.
  usuarioId?: string;
  /// Columna "Ch." (chofer): número del móvil que condujo. Sólo aplica a quien
  /// concurrió.
  movil?: string;
  /// Columna "G": ya estaba de guardia cuando entró el aviso.
  guardia?: boolean;
  /// Columna "BP": lo convocó el **busca persona** (el localizador del
  /// cuartel), a diferencia de quien ya estaba de guardia. La clave se llama
  /// `bp` porque así se rotula la columna en el formulario oficial.
  bp?: boolean;
};

export type PersonalParte = {
  concurrio: PersonaParte[];
  enCuartel: PersonaParte[];
};

export const PERSONAL_VACIO: PersonalParte = { concurrio: [], enCuartel: [] };

/// Casilleros que tiene cada tabla en el formulario oficial. Lo que exceda no
/// entra en el PDF (se avisa en la UI), pero se guarda igual.
export const CUPO_CONCURRIO = 36; // 3 columnas × 12 filas
export const CUPO_EN_CUARTEL = 21; // 3 columnas × 7 filas

/// Tope defensivo del payload: el campo llega como JSON desde el cliente.
const MAX_FILAS = 100;

const esquemaPersona = z.object({
  nombre: z.string().trim().min(1),
  usuarioId: z.string().trim().min(1).optional(),
  movil: z.string().trim().min(1).optional(),
  guardia: z.boolean().optional(),
  bp: z.boolean().optional(),
});

const esquemaPersonal = z.object({
  concurrio: z.array(esquemaPersona).max(MAX_FILAS).default([]),
  enCuartel: z.array(esquemaPersona).max(MAX_FILAS).default([]),
});

/// Convierte el formato viejo (array de strings, una persona por línea del
/// textarea anterior a P6) a la forma nueva. Los partes ya cargados tienen que
/// seguir abriéndose y exportándose, así que se traducen al leer en vez de
/// migrar la columna Json.
function desdeFormatoViejo(valor: unknown[]): PersonalParte {
  return {
    concurrio: valor
      .map((v) => String(v).trim())
      .filter(Boolean)
      .map((nombre) => ({ nombre })),
    enCuartel: [],
  };
}

/// Lee el Json de `ParteIntervencion.personal`. Tolerante como `leerDetalle`:
/// el campo puede traer null, el formato viejo o cualquier cosa.
export function leerPersonal(valor: unknown): PersonalParte {
  if (!valor) return PERSONAL_VACIO;
  if (Array.isArray(valor)) return desdeFormatoViejo(valor);
  const parsed = esquemaPersonal.safeParse(valor);
  return parsed.success ? parsed.data : PERSONAL_VACIO;
}

/// Lee el campo oculto del formulario, que `SelectorPersonal` manda como JSON
/// (una sola cadena en vez de arrays paralelos: evita que se desalineen las
/// filas cuando un casillero queda vacío o un checkbox no se envía).
export function leerPersonalDeFormulario(valor: unknown): PersonalParte {
  if (typeof valor !== "string" || valor.trim() === "") return PERSONAL_VACIO;
  try {
    return leerPersonal(JSON.parse(valor));
  } catch {
    return PERSONAL_VACIO;
  }
}

/// True si el personal cargado no entra en los casilleros del formulario
/// oficial (para avisarlo en la UI en vez de recortar en silencio).
export function excedeElFormulario(personal: PersonalParte): boolean {
  return (
    personal.concurrio.length > CUPO_CONCURRIO ||
    personal.enCuartel.length > CUPO_EN_CUARTEL
  );
}
