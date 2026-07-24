import { randomBytes, createHash } from "node:crypto";

// Días de validez del link de activación.
const DIAS_VALIDEZ = 7;

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
