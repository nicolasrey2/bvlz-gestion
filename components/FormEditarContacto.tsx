"use client";

import { useActionState } from "react";
import { editarContacto, type EstadoEditar } from "@/server/personal";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const label =
  "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";

/// Edita los datos de contacto de un usuario: legajo, DNI, teléfono y,
/// opcionalmente, nombre/apellido. Los permisos se validan en el servidor
/// (editarContacto, solo conducción).
export function FormEditarContacto({
  usuarioId,
  nombre,
  apellido,
  legajo,
  dni,
  telefono,
}: {
  usuarioId: string;
  nombre: string;
  apellido: string;
  legajo: string | null;
  dni: string | null;
  telefono: string | null;
}) {
  const [state, action, pending] = useActionState<EstadoEditar, FormData>(
    editarContacto,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="usuarioId" value={usuarioId} />

      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Nombre
          <input name="nombre" defaultValue={nombre} className={input} />
        </label>
        <label className={label}>
          Apellido
          <input name="apellido" defaultValue={apellido} className={input} />
        </label>
      </div>

      <label className={label}>
        Legajo
        <input name="legajo" defaultValue={legajo ?? ""} className={input} />
      </label>
      <label className={label}>
        DNI
        <input name="dni" defaultValue={dni ?? ""} className={input} />
      </label>
      <label className={label}>
        Teléfono
        <input
          name="telefono"
          defaultValue={telefono ?? ""}
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
          Datos actualizados.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-700 px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar datos"}
      </button>
    </form>
  );
}
