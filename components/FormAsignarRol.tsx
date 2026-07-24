"use client";

import { useState } from "react";
import { asignarRol } from "@/server/personal";
import { NOMBRE_ROL, ROLES_DE_AREA } from "@/lib/dominio";
import type { RolTipo } from "@/generated/prisma/client";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

export function FormAsignarRol({
  usuarioId,
  areas,
}: {
  usuarioId: string;
  areas: { id: string; nombre: string }[];
}) {
  const [rol, setRol] = useState<RolTipo | "">("");
  const pideArea = rol !== "" && ROLES_DE_AREA.includes(rol);

  return (
    <form action={asignarRol} className="flex flex-col gap-2">
      <input type="hidden" name="usuarioId" value={usuarioId} />
      <select
        name="rol"
        value={rol}
        onChange={(e) => setRol(e.target.value as RolTipo | "")}
        required
        className={input}
      >
        <option value="">Elegí un rol…</option>
        {(Object.keys(NOMBRE_ROL) as RolTipo[]).map((r) => (
          <option key={r} value={r}>
            {NOMBRE_ROL[r]}
          </option>
        ))}
      </select>

      {pideArea && (
        <select name="areaId" required className={input}>
          <option value="">Elegí un área…</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      )}

      <button
        type="submit"
        disabled={rol === ""}
        className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Asignar rol
      </button>
    </form>
  );
}
