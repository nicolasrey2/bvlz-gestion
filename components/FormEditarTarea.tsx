"use client";

import { useActionState } from "react";
import { editarTarea, type EstadoForm } from "@/server/tareas";
import { PRIORIDADES } from "@/lib/dominio";
import type { Prioridad } from "@/generated/prisma/client";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const label =
  "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";

type Area = { id: string; nombre: string };

/// Edición de tarea. Reutiliza la estructura de FormNuevaTarea, sin el campo
/// de responsables (eso se cambia aparte, con ReasignarTarea).
export function FormEditarTarea({
  tarea,
  areas,
  permiteGeneral,
}: {
  tarea: {
    id: string;
    titulo: string;
    descripcion: string | null;
    prioridad: Prioridad;
    areaId: string | null;
    fechaLimite: Date | null;
  };
  areas: Area[];
  permiteGeneral: boolean;
}) {
  const [state, action, pending] = useActionState<EstadoForm, FormData>(
    editarTarea,
    null,
  );

  // Fecha "día" guardada como medianoche UTC: tomar el ISO tal cual para no
  // correrse un día al mostrarla en el <input type="date">.
  const fechaISO = tarea.fechaLimite
    ? tarea.fechaLimite.toISOString().slice(0, 10)
    : "";

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="tareaId" value={tarea.id} />

      <label className={label}>
        Título
        <input name="titulo" required defaultValue={tarea.titulo} className={input} />
      </label>

      <label className={label}>
        Descripción
        <textarea
          name="descripcion"
          rows={3}
          defaultValue={tarea.descripcion ?? ""}
          className={input}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Prioridad
          <select name="prioridad" defaultValue={tarea.prioridad} className={input}>
            {PRIORIDADES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className={label}>
          Fecha límite
          <input
            type="date"
            name="fechaLimite"
            defaultValue={fechaISO}
            className={input}
          />
        </label>
      </div>

      <label className={label}>
        Área
        <select
          name="areaId"
          required={!permiteGeneral}
          defaultValue={tarea.areaId ?? ""}
          className={input}
        >
          {permiteGeneral && <option value="">General del destacamento</option>}
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
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
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
