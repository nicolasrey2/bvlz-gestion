"use client";

import { useActionState, useRef } from "react";
import {
  guardarUbicacionCuartel,
  type EstadoUbicacionCuartel,
} from "@/server/config";

type Props = {
  latitud: number | null;
  longitud: number | null;
  radio: number;
};

/// Formulario de configuración de la ubicación del cuartel: coordenadas y
/// radio de tolerancia para el geo-fichado (suave). Solo lo ve conducción
/// (el filtro de acceso lo hace la página que lo renderiza).
export function FormUbicacionCuartel({ latitud, longitud, radio }: Props) {
  const [state, action, pending] = useActionState<
    EstadoUbicacionCuartel,
    FormData
  >(guardarUbicacionCuartel, null);

  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);

  // Autocompleta los inputs con la ubicación actual del dispositivo, sin
  // enviar el formulario: la persona todavía puede revisar/ajustar antes de
  // guardar.
  function usarMiUbicacion() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      if (latRef.current) latRef.current.value = String(pos.coords.latitude);
      if (lngRef.current) lngRef.current.value = String(pos.coords.longitude);
    });
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
          Latitud
          <input
            ref={latRef}
            type="number"
            step="any"
            name="latitud"
            defaultValue={latitud ?? ""}
            required
            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
          Longitud
          <input
            ref={lngRef}
            type="number"
            step="any"
            name="longitud"
            defaultValue={longitud ?? ""}
            required
            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        Radio de tolerancia (metros)
        <input
          type="number"
          step="1"
          min="1"
          name="radioFichadoM"
          defaultValue={radio}
          required
          className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={usarMiUbicacion}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          Usar mi ubicación actual
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar ubicación"}
        </button>
      </div>

      {state && "error" in state && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state && "ok" in state && state.ok && (
        <p className="text-sm text-green-700 dark:text-green-500">
          Ubicación guardada.
        </p>
      )}
    </form>
  );
}
