"use client";

import { useActionState, useEffect, useState } from "react";
import { fichar, type EstadoFichado } from "@/server/fichado";

/// Coordenadas del dispositivo al momento de fichar, o null si no hay
/// permiso/soporte/se venció el tiempo. Nunca bloquea el fichado.
type Coords = { lat: number; lng: number } | null;

/// Botones de fichar entrada/salida. Cada uno tiene su propio estado de
/// `useActionState` (misma action del servidor) para poder mostrar el error
/// de coherencia (p. ej. "ya fichaste entrada") sin recargar la página.
export function FormFichado() {
  const [entradaState, entradaAction, entradaPending] = useActionState<
    EstadoFichado,
    FormData
  >(fichar, null);
  const [salidaState, salidaAction, salidaPending] = useActionState<
    EstadoFichado,
    FormData
  >(fichar, null);

  // Geo-fichado SUAVE: se intenta obtener la ubicación al entrar a la
  // pantalla, pero si se niega el permiso, no hay soporte o tarda demasiado,
  // simplemente queda en null y el fichado sigue funcionando igual.
  const [coords, setCoords] = useState<Coords>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // Permiso denegado, timeout u otro error: seguimos sin coords.
        setCoords(null);
      },
      { timeout: 8000 },
    );
  }, []);

  const error = entradaState?.error ?? salidaState?.error;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        <form action={entradaAction}>
          <input type="hidden" name="tipo" value="ENTRADA" />
          <input type="hidden" name="lat" value={coords?.lat ?? ""} />
          <input type="hidden" name="lng" value={coords?.lng ?? ""} />
          <button
            type="submit"
            disabled={entradaPending}
            className="w-full rounded-2xl bg-green-700 px-4 py-6 text-lg font-semibold text-white transition-colors disabled:opacity-60"
          >
            {entradaPending ? "Fichando…" : "Fichar entrada"}
          </button>
        </form>
        <form action={salidaAction}>
          <input type="hidden" name="tipo" value="SALIDA" />
          <input type="hidden" name="lat" value={coords?.lat ?? ""} />
          <input type="hidden" name="lng" value={coords?.lng ?? ""} />
          <button
            type="submit"
            disabled={salidaPending}
            className="w-full rounded-2xl bg-zinc-700 px-4 py-6 text-lg font-semibold text-white transition-colors disabled:opacity-60"
          >
            {salidaPending ? "Fichando…" : "Fichar salida"}
          </button>
        </form>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
