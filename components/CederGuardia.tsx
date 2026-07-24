"use client";

import { useState } from "react";
import { cederGuardia } from "@/server/guardias";

/// Control para ceder la guardia a otro bombero (se despliega al tocar).
export function CederGuardia({
  guardiaId,
  opciones,
}: {
  guardiaId: string;
  opciones: { id: string; nombre: string; apellido: string }[];
}) {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-2 text-xs font-medium text-zinc-500 underline"
      >
        Ceder mi guardia
      </button>
    );
  }

  return (
    <form action={cederGuardia} className="mt-2 flex gap-2">
      <input type="hidden" name="guardiaId" value={guardiaId} />
      <select
        name="aUsuarioId"
        required
        className="flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <option value="">Ceder a…</option>
        {opciones.map((u) => (
          <option key={u.id} value={u.id}>
            {u.apellido}, {u.nombre}
          </option>
        ))}
      </select>
      <button className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-semibold text-white">
        Ceder
      </button>
    </form>
  );
}
