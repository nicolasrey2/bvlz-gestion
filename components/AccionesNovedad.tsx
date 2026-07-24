"use client";

import { useActionState, useEffect, useState } from "react";
import { editarNovedad, eliminarNovedad, type EstadoForm } from "@/server/novedades";
import { BotonAccion } from "@/components/BotonAccion";
import type { TipoNovedad } from "@/generated/prisma/client";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

/// Acciones de "Editar"/"Eliminar" sobre una novedad propia. Se muestra solo
/// para el autor (o conducción) — la visibilidad la decide quien la renderiza,
/// pero el permiso real siempre se revalida en el servidor.
export function AccionesNovedad({
  id,
  tipo,
  texto,
  tipos,
}: {
  id: string;
  tipo: TipoNovedad;
  texto: string;
  tipos: { value: TipoNovedad; label: string }[];
}) {
  const [editando, setEditando] = useState(false);
  const [huboEnvio, setHuboEnvio] = useState(false);
  const [state, action, pending] = useActionState<EstadoForm, FormData>(
    editarNovedad,
    null,
  );

  // Al terminar un guardado sin error, cierro el formulario de edición.
  useEffect(() => {
    if (huboEnvio && !pending && !state?.error) {
      setEditando(false);
      setHuboEnvio(false);
    }
  }, [huboEnvio, pending, state]);

  if (!editando) {
    return (
      <div className="mt-2 flex gap-3 text-xs font-medium">
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-zinc-500 underline"
        >
          Editar
        </button>
        <form action={eliminarNovedad}>
          <input type="hidden" name="id" value={id} />
          <BotonAccion
            confirmar="¿Eliminar esta novedad? No se puede deshacer."
            pendiente="Eliminando…"
            className="text-red-700 underline dark:text-red-400"
          >
            Eliminar
          </BotonAccion>
        </form>
      </div>
    );
  }

  return (
    <form
      action={action}
      onSubmit={() => setHuboEnvio(true)}
      className="mt-2 flex flex-col gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <select name="tipo" defaultValue={tipo} className={input}>
        {tipos.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <textarea name="texto" required rows={3} defaultValue={texto} className={input} />

      {state?.error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
