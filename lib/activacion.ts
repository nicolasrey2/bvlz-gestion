import { randomBytes, createHash } from "node:crypto";

// Días de validez del link de activación. Se exporta para poder decirlo en la
// pantalla de activación sin repetir el número a mano.
export const DIAS_VALIDEZ = 7;

/// Hash SHA-256 del token. En la DB se guarda solo el hash (nunca el token en
/// claro), como con las contraseñas.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/// Genera un token de activación de un solo uso + su hash + su vencimiento.
export function generarActivacion(): { token: string; hash: string; expira: Date } {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    hash: hashToken(token),
    expira: new Date(Date.now() + DIAS_VALIDEZ * 24 * 60 * 60 * 1000),
  };
}

/// Contraseña aleatoria "inutilizable": la cuenta se crea con esto y la persona
/// define su clave real al activar. Nadie usa esta contraseña.
export function passwordAleatoria(): string {
  return randomBytes(24).toString("base64url");
}

/// En qué estado está un link de activación. Son tres y no dos porque cada uno
/// tiene una salida distinta para la persona: definir la contraseña, pedirle
/// otro link al encargado, o simplemente iniciar sesión.
export type EstadoLink = "vigente" | "vencido" | "usado";

/// Decide el estado del link a partir del usuario que tiene ese token (o
/// `null` si no hay ninguno).
///
/// `null` es el caso **más común en la práctica**, y no significa "link falso":
/// al activar la cuenta se borra el hash del token, así que quien vuelve a
/// abrir su link por costumbre cae acá. Por eso se trata como "usado" y no
/// como error.
export function estadoLink(
  usuario: { cuentaActivada: boolean; activacionExpira: Date | null } | null,
  ahora: Date = new Date(),
): EstadoLink {
  if (!usuario || usuario.cuentaActivada) return "usado";
  if (!usuario.activacionExpira || usuario.activacionExpira <= ahora) {
    return "vencido";
  }
  return "vigente";
}
