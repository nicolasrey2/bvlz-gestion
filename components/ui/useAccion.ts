"use client";

import { useActionState, useEffect, useRef } from "react";
import { useToast } from "./Toast";
import { esError, esExito, type ResultadoAccion } from "@/lib/acciones";

/// Envuelve una Server Action con firma `(prev, formData) => ResultadoAccion`
/// aplicando la convención de feedback del batch 1:
///   - errores → se devuelven en `error` para mostrarlos inline;
///   - éxitos  → disparan un toast automático.
/// Uso típico en un componente cliente:
///   const { formAction, pending, error } = useAccion(aprobarTarea, {
///     exito: "Tarea aprobada.",
///   });
///   return <form action={formAction}> … <ErrorAccion mensaje={error} /> </form>;
export function useAccion(
  accion: (prev: ResultadoAccion, formData: FormData) => Promise<ResultadoAccion>,
  opciones?: { exito?: string },
) {
  const { mostrar } = useToast();
  const [estado, formAction, pending] = useActionState<ResultadoAccion, FormData>(
    accion,
    null,
  );

  // Dispara el toast una sola vez por transición a "éxito" (comparando la
  // referencia del estado, que cambia en cada submit).
  const ultimoRef = useRef<ResultadoAccion>(null);
  useEffect(() => {
    if (estado === ultimoRef.current) return;
    ultimoRef.current = estado;
    if (esExito(estado)) {
      mostrar(estado.mensaje ?? opciones?.exito ?? "Listo.", "exito");
    }
  }, [estado, mostrar, opciones?.exito]);

  const error = esError(estado) ? estado.error : null;
  return { formAction, pending, error, estado };
}
