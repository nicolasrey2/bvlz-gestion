"use client";

import { useActionState, useState } from "react";
import { crearUsuario, type EstadoForm } from "@/server/personal";
import { RANGOS, NOMBRE_ROL, ROLES_DE_AREA } from "@/lib/dominio";
import { BotonCopiar } from "@/components/BotonCopiar";
import type { RolTipo } from "@/generated/prisma/client";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const label =
  "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function FormNuevoUsuario({
  areas,
}: {
  areas: { id: string; nombre: string }[];
}) {
  const [state, action, pending] = useActionState<EstadoForm, FormData>(
    crearUsuario,
    null,
  );
  const [rol, setRol] = useState<RolTipo | "">("");

  // El área solo se pide para roles de área (encargado de área / miembro).
  const pideArea = rol !== "" && ROLES_DE_AREA.includes(rol);

  // Éxito: mostrar el link de activación para compartir (no se seteó contraseña).
  if (state && "ok" in state && state.ok) {
    const url =
      (typeof window !== "undefined" ? window.location.origin : "") + state.path;
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-green-50 p-4 dark:bg-green-950/30">
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
            ✓ Usuario creado
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Enviale este link (por WhatsApp, mail o como quieras) para que defina
            su contraseña. Vence en 7 días.
          </p>
          <div className="mt-3 flex gap-2">
            <input readOnly value={url} className={`${input} flex-1`} />
            <BotonCopiar texto={url} />
          </div>
        </div>
        <a
          href="/personal/nuevo"
          className="text-center text-sm font-semibold text-red-700 underline"
        >
          Dar de alta otra persona
        </a>
        <a href="/personal" className="text-center text-sm text-zinc-500">
          Volver a Personal
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Nombre
          <input name="nombre" required className={input} />
        </label>
        <label className={label}>
          Apellido
          <input name="apellido" required className={input} />
        </label>
      </div>

      <label className={label}>
        Email
        <input type="email" name="email" required className={input} />
      </label>

      <label className={label}>
        Rango
        <select name="rango" required defaultValue="BOMBERO" className={input}>
          {RANGOS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <label className={label}>
        Rol (opcional)
        <select
          name="rol"
          value={rol}
          onChange={(e) => setRol(e.target.value as RolTipo | "")}
          className={input}
        >
          <option value="">Sin rol por ahora</option>
          {(Object.keys(NOMBRE_ROL) as RolTipo[]).map((r) => (
            <option key={r} value={r}>
              {NOMBRE_ROL[r]}
            </option>
          ))}
        </select>
      </label>

      {pideArea && (
        <label className={label}>
          Área
          <select name="areaId" required className={input}>
            <option value="">Elegí un área</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>
      )}

      {state && "error" in state && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <p className="text-xs text-zinc-500">
        No se define contraseña acá: al crear el usuario obtenés un link para que
        la persona elija su propia clave.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-700 px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}
