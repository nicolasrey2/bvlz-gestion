"use client";

import { useActionState } from "react";
import { resetearPassword, type EstadoRegenerar } from "@/server/activacion";
import { BotonCopiar } from "@/components/BotonCopiar";
import { BotonConfirmar } from "@/components/BotonConfirmar";

/// Resetea la contraseña de una cuenta ya activada: la vuelve a "pendiente"
/// y genera un nuevo link de activación para que la persona defina una clave
/// nueva (mismo mecanismo y patrón visual que RegenerarActivacion).
export function ResetearPassword({ usuarioId }: { usuarioId: string }) {
  const [state, action, pending] = useActionState<EstadoRegenerar, FormData>(
    resetearPassword,
    null,
  );

  const url =
    state && "ok" in state && state.ok
      ? (typeof window !== "undefined" ? window.location.origin : "") +
        state.path
      : null;

  if (url) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Compartile este link para que defina su nueva contraseña:
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <BotonCopiar texto={url} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="usuarioId" value={usuarioId} />
        <BotonConfirmar
          mensaje="¿Resetear la contraseña de este usuario? Va a tener que definir una nueva con un link."
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300"
        >
          {pending ? "Generando…" : "Resetear contraseña"}
        </BotonConfirmar>
      </form>
      {state && "error" in state && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </div>
  );
}
