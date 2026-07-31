"use client";

import { useActionState } from "react";
import { cambiarEmail, type EstadoEditar } from "@/server/personal";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const label =
  "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";

/// Cambia el email con el que un usuario inicia sesión (P7). Los permisos y la
/// normalización se validan en el servidor (`cambiarEmail`, solo conducción).
export function CambiarEmail({
  usuarioId,
  email,
}: {
  usuarioId: string;
  email: string;
}) {
  const [state, action, pending] = useActionState<EstadoEditar, FormData>(
    cambiarEmail,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="usuarioId" value={usuarioId} />

      <label className={label}>
        Email de acceso
        <input
          type="email"
          name="email"
          defaultValue={email}
          required
          autoComplete="off"
          className={input}
        />
      </label>

      {state && "error" in state && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      )}
      {state && "ok" in state && state.ok && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Email actualizado. La persona ya entra con el nuevo; la contraseña no
          cambió.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-700 px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Cambiar email"}
      </button>
    </form>
  );
}
