"use client";

import { useActionState } from "react";
import { crearParte, type EstadoForm } from "@/server/partes";
import { TIPOS_SINIESTRO } from "@/lib/dominio";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const label =
  "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";
const legend = "text-sm font-semibold text-zinc-500";

export function FormNuevoParte() {
  const [state, action, pending] = useActionState<EstadoForm, FormData>(
    crearParte,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* Datos del servicio */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Datos del servicio</legend>

        <label className={label}>
          Tipo de siniestro
          <select name="tipoSiniestro" required className={input}>
            {TIPOS_SINIESTRO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            Fecha
            <input type="date" name="fecha" className={input} />
          </label>
          <label className={label}>
            N° de servicio
            <input name="servicioNro" className={input} />
          </label>
        </div>

        <label className={label}>
          Cuartel
          <input name="cuartel" className={input} />
        </label>

        <label className={label}>
          Objeto
          <input name="objeto" placeholder="Ej. Vivienda, comercio, vehículo…" className={input} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            Dirección
            <input name="direccion" className={input} />
          </label>
          <label className={label}>
            Localidad
            <input name="localidad" className={input} />
          </label>
        </div>
      </fieldset>

      {/* Tiempos */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Tiempos</legend>
        <div className="grid grid-cols-3 gap-3">
          <label className={label}>
            Aviso
            <input type="time" name="horaAviso" className={input} />
          </label>
          <label className={label}>
            Llegada
            <input type="time" name="horaLlegada" className={input} />
          </label>
          <label className={label}>
            Regreso
            <input type="time" name="horaRegreso" className={input} />
          </label>
        </div>
      </fieldset>

      {/* Recursos */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Recursos</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            Dotaciones
            <input type="number" min={0} name="dotaciones" className={input} />
          </label>
          <label className={label}>
            Bomberos
            <input type="number" min={0} name="bomberos" className={input} />
          </label>
        </div>
        <label className={label}>
          Unidades
          <input name="unidades" placeholder="Ej. Autobomba 1, Ambulancia" className={input} />
        </label>
      </fieldset>

      {/* Descripción */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Descripción</legend>
        <label className={label}>
          Descripción de las tareas realizadas
          <textarea name="descripcion" rows={4} className={input} />
        </label>
      </fieldset>

      {/* Personal */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Personal</legend>
        <label className={label}>
          Personal que concurrió (una persona por línea)
          <textarea
            name="personal"
            rows={4}
            placeholder={"Cabo Pérez\nBombero Gómez"}
            className={input}
          />
        </label>
      </fieldset>

      {/* Firmas */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Firmas</legend>
        <label className={label}>
          Datos tomados por
          <input name="datosTomadosPor" className={input} />
        </label>
        <label className={label}>
          Oficial actuante
          <input name="oficialActuante" className={input} />
        </label>
        <label className={label}>
          Jefe del Cuerpo
          <input name="jefeCuerpo" className={input} />
        </label>
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
        {pending ? "Creando…" : "Crear parte"}
      </button>
    </form>
  );
}
