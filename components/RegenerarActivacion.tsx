"use client";

import { useActionState } from "react";
import { regenerarActivacion, type EstadoRegenerar } from "@/server/activacion";
import { BotonCopiar } from "@/components/BotonCopiar";

/// Genera (y muestra) un nuevo link de activación para una cuenta pendiente.
export function RegenerarActivacion({ usuarioId }: { usuarioId: string }) {
  const [state, action, pending] = useActionState<EstadoRegenerar, FormData>(
    regenerarActivacion,
    null,
  );

  const url =
    state && "ok" in state && state.ok
      ? (typeof window !== "undefined" ? window.location.origin : "") + state.path
      : null;

  if (url) {
    return (
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <BotonCopiar texto={url} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="usuarioId" value={usuarioId} />
        <button
          disabled={pending}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300"
        >
          {pending ? "Generando…" : "Generar link de activación"}
        </button>
      </form>
      {state && "error" in state && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </div>
  );
}
