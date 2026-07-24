"use client";

import { useActionState } from "react";
import { activarCuenta, type EstadoActivar } from "@/server/activacion";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const label =
  "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function FormActivar({ token }: { token: string }) {
  const [state, action, pending] = useActionState<EstadoActivar, FormData>(
    activarCuenta,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <label className={label}>
        Contraseña
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          autoFocus
          placeholder="mínimo 8 caracteres"
          className={input}
        />
      </label>
      <label className={label}>
        Repetir contraseña
        <input
          type="password"
          name="password2"
          required
          minLength={8}
          autoComplete="new-password"
          className={input}
        />
      </label>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-700 px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
      >
        {pending ? "Activando…" : "Activar cuenta"}
      </button>
    </form>
  );
}
