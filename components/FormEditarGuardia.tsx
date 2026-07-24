"use client";

import { useActionState } from "react";
import { editarGuardia, type EstadoForm } from "@/server/guardias";
import { NOMBRE_TIPO_GUARDIA, horarioGuardia } from "@/lib/dominio";
import type { TipoGuardia } from "@/generated/prisma/client";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const label =
  "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function FormEditarGuardia({
  guardia,
  usuarios,
}: {
  guardia: {
    id: string;
    tipo: TipoGuardia;
    fecha: Date;
    cuarteleroNombre: string | null;
    notas: string | null;
    participantesIds: string[];
  };
  usuarios: { id: string; nombre: string; apellido: string }[];
}) {
  const [state, action, pending] = useActionState<EstadoForm, FormData>(
    editarGuardia,
    null,
  );

  // Fecha "día" guardada como medianoche UTC: tomar el ISO tal cual para no
  // correrse un día al mostrarla en el <input type="date">.
  const fechaISO = guardia.fecha.toISOString().slice(0, 10);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="guardiaId" value={guardia.id} />

      <div className={label}>
        Tipo de guardia
        {/* El tipo no se puede cambiar al editar: se muestra fijo. */}
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-base text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {NOMBRE_TIPO_GUARDIA[guardia.tipo]}
        </p>
        <span className="text-xs font-normal text-zinc-500">
          Horario: {horarioGuardia(guardia.tipo)}
        </span>
      </div>

      <label className={label}>
        Fecha
        <input
          type="date"
          name="fecha"
          required
          defaultValue={fechaISO}
          className={input}
        />
      </label>

      {guardia.tipo === "INTERNA" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Bomberos de guardia
          </legend>
          <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            {usuarios.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="participantes"
                  value={u.id}
                  defaultChecked={guardia.participantesIds.includes(u.id)}
                />
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
            defaultValue={guardia.cuarteleroNombre ?? ""}
            className={input}
          />
        </label>
      )}

      <label className={label}>
        Notas (opcional)
        <input name="notas" defaultValue={guardia.notas ?? ""} className={input} />
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
