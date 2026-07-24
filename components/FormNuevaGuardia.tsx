"use client";

import { useActionState, useState } from "react";
import { crearGuardia, type EstadoForm } from "@/server/guardias";
import { horarioGuardia } from "@/lib/dominio";
import type { TipoGuardia } from "@/generated/prisma/client";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const label =
  "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function FormNuevaGuardia({
  usuarios,
}: {
  usuarios: { id: string; nombre: string; apellido: string }[];
}) {
  const [state, action, pending] = useActionState<EstadoForm, FormData>(
    crearGuardia,
    null,
  );
  const [tipo, setTipo] = useState<TipoGuardia>("INTERNA");

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={label}>
        Tipo de guardia
        <select
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoGuardia)}
          className={input}
        >
          <option value="INTERNA">Interna del destacamento</option>
          <option value="CUARTELERO">Cuartelero (externo)</option>
        </select>
        <span className="text-xs font-normal text-zinc-500">
          Horario: {horarioGuardia(tipo)}
        </span>
      </label>

      <label className={label}>
        Fecha
        <input type="date" name="fecha" required className={input} />
      </label>

      {tipo === "INTERNA" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Bomberos de guardia
          </legend>
          <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            {usuarios.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="participantes" value={u.id} />
                {u.apellido}, {u.nombre}
              </label>
            ))}
            {usuarios.length === 0 && (
              <span className="text-sm text-zinc-400">Sin personal cargado.</span>
            )}
          </div>
        </fieldset>
      ) : (
        <label className={label}>
          Nombre del cuartelero
          <input
            name="cuarteleroNombre"
            placeholder="Apellido y nombre"
            className={input}
          />
        </label>
      )}

      <label className={label}>
        Notas (opcional)
        <input name="notas" className={input} />
      </label>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-red-700 px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Agregar guardia"}
      </button>
    </form>
  );
}
