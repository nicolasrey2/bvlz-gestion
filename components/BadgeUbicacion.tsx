import { estadoUbicacion, type EstadoUbicacion } from "@/lib/geo";

// Texto + color por estado de ubicación (geo-fichado suave). "sin_ubicacion"
// no muestra nada (la persona no compartió ubicación).
const CONFIG: Record<
  EstadoUbicacion,
  { texto: string; clase: string } | null
> = {
  fuera: { texto: "fuera del cuartel", clase: "text-red-600 dark:text-red-400" },
  sin_verificar: { texto: "ubicación sin verificar", clase: "text-zinc-400" },
  en_cuartel: { texto: "en el cuartel", clase: "text-green-600 dark:text-green-400" },
  sin_ubicacion: null,
};

/// Chip del estado de ubicación de una fichada. Por defecto no muestra el caso
/// "en el cuartel" (para no ensuciar); en el registro de oficina se puede
/// activar con `mostrarEnCuartel` y ver la distancia con `mostrarDistancia`.
export function BadgeUbicacion({
  fichada,
  mostrarEnCuartel = false,
  mostrarDistancia = false,
}: {
  fichada: {
    latitud: number | null;
    distanciaM: number | null;
    ubicacionVerificada: boolean;
  };
  mostrarEnCuartel?: boolean;
  mostrarDistancia?: boolean;
}) {
  const estado = estadoUbicacion(fichada);
  if (estado === "en_cuartel" && !mostrarEnCuartel) return null;
  const cfg = CONFIG[estado];
  if (!cfg) return null;

  const sufijo =
    mostrarDistancia && estado === "fuera" && fichada.distanciaM != null
      ? ` (${Math.round(fichada.distanciaM)} m)`
      : "";

  return (
    <span className={`ml-2 text-xs ${cfg.clase}`}>
      {cfg.texto}
      {sufijo}
    </span>
  );
}
