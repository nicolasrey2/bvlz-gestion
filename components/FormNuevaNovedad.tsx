"use client";

import { useActionState } from "react";
import { crearNovedad, type EstadoForm } from "@/server/novedades";
import type { TipoNovedad } from "@/generated/prisma/client";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const label =
  "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function FormNuevaNovedad({
  tipos,
}: {
  tipos: { value: TipoNovedad; label: string }[];
}) {
  const [state, action, pending] = useActionState<EstadoForm, FormData>(
    crearNovedad,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={label}>
        Tipo
        <select name="tipo" defaultValue={tipos[0]?.value} className={input}>
          {tipos.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className={label}>
        Detalle
        <textarea name="texto" required rows={3} className={input} />
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
        {pending ? "Registrando…" : "Registrar novedad"}
      </button>
    </form>
  );
}
