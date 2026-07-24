"use client";

import { useState } from "react";
import { reasignarTarea } from "@/server/tareas";

type Usuario = { id: string; nombre: string; apellido: string };

/// Reemplaza el conjunto de responsables de la tarea. Recibe la lista de
/// usuarios activos del destacamento y cuáles ya están asignados por props
/// (datos ya resueltos por el server component del detalle).
export function ReasignarTarea({
  tareaId,
  usuarios,
  asignadosIds,
}: {
  tareaId: string;
  usuarios: Usuario[];
  asignadosIds: string[];
}) {
  const [guardando, setGuardando] = useState(false);

  return (
    <form
      action={reasignarTarea}
      onSubmit={() => setGuardando(true)}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="tareaId" value={tareaId} />
      <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
        {usuarios.map((u) => (
          <label key={u.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="asignados"
              value={u.id}
              defaultChecked={asignadosIds.includes(u.id)}
            />
            {u.apellido}, {u.nombre}
          </label>
        ))}
        {usuarios.length === 0 && (
          <span className="text-sm text-zinc-400">Sin personal cargado.</span>
        )}
      </div>
      <button
        type="submit"
        disabled={guardando}
        className="self-end rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Guardar responsables"}
      </button>
    </form>
  );
}
