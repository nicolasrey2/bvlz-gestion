"use client";

import { useActionState } from "react";
import { crearTarea, type EstadoForm } from "@/server/tareas";
import { PRIORIDADES } from "@/lib/dominio";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const label =
  "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";

type Usuario = { id: string; nombre: string; apellido: string };
type Area = { id: string; nombre: string };

export function FormNuevaTarea({
  areas,
  usuarios,
  permiteGeneral,
}: {
  areas: Area[];
  usuarios: Usuario[];
  permiteGeneral: boolean;
}) {
  const [state, action, pending] = useActionState<EstadoForm, FormData>(
    crearTarea,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={label}>
        Título
        <input name="titulo" required className={input} />
      </label>

      <label className={label}>
        Descripción
        <textarea name="descripcion" rows={3} className={input} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Prioridad
          <select name="prioridad" defaultValue="MEDIA" className={input}>
            {PRIORIDADES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className={label}>
          Fecha límite
          <input type="date" name="fechaLimite" className={input} />
        </label>
      </div>

      <label className={label}>
        Área
        <select name="areaId" required={!permiteGeneral} className={input}>
          {permiteGeneral && <option value="">General del destacamento</option>}
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Responsables
        </legend>
        <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          {usuarios.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="asignados" value={u.id} />
              {u.apellido}, {u.nombre}
            </label>
          ))}
          {usuarios.length === 0 && (
            <span className="text-sm text-zinc-400">Sin personal cargado.</span>
          )}
        </div>
      </fieldset>

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
        {pending ? "Creando…" : "Crear tarea"}
      </button>
    </form>
  );
}
