"use client";

import { useActionState } from "react";
import { fichar, type EstadoFichado } from "@/server/fichado";

/// Botones de fichar entrada/salida. Cada uno tiene su propio estado de
/// `useActionState` (misma action del servidor) para poder mostrar el error
/// de coherencia (p. ej. "ya fichaste entrada") sin recargar la página.
export function FormFichado() {
  const [entradaState, entradaAction, entradaPending] = useActionState<
    EstadoFichado,
    FormData
  >(fichar, null);
  const [salidaState, salidaAction, salidaPending] = useActionState<
    EstadoFichado,
    FormData
  >(fichar, null);

  const error = entradaState?.error ?? salidaState?.error;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        <form action={entradaAction}>
          <input type="hidden" name="tipo" value="ENTRADA" />
          <button
            type="submit"
            disabled={entradaPending}
            className="w-full rounded-2xl bg-green-700 px-4 py-6 text-lg font-semibold text-white transition-colors disabled:opacity-60"
          >
            {entradaPending ? "Fichando…" : "Fichar entrada"}
          </button>
        </form>
        <form action={salidaAction}>
          <input type="hidden" name="tipo" value="SALIDA" />
          <button
            type="submit"
            disabled={salidaPending}
            className="w-full rounded-2xl bg-zinc-700 px-4 py-6 text-lg font-semibold text-white transition-colors disabled:opacity-60"
          >
            {salidaPending ? "Fichando…" : "Fichar salida"}
          </button>
        </form>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
