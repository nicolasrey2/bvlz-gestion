import { z } from "zod";

/// Normaliza un email para guardarlo y compararlo: sin espacios alrededor y en
/// minúsculas.
///
/// El RFC dice que la parte local (lo que va antes de la @) es case-sensitive,
/// pero ningún proveedor real la trata así. Normalizar evita el problema
/// concreto que tenemos: `Usuario.email` es `@unique` y en Postgres esa
/// unicidad distingue mayúsculas, así que sin esto "Juan@x.com" y "juan@x.com"
/// conviven como dos cuentas distintas (S4).
export function normalizarEmail(valor: string): string {
  return valor.trim().toLowerCase();
}

/// Campo de email para los esquemas de Zod (S4). Normaliza PRIMERO y valida el
/// formato después, así "  Juan@X.com " se acepta y queda guardado como
/// "juan@x.com" en vez de rechazarse por los espacios.
export const campoEmail = z
  .string()
  .transform(normalizarEmail)
  .pipe(z.email("Ingresá un email válido."));
