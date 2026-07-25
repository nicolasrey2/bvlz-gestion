/// Estado de la ubicación de una fichada (geo-fichado suave):
/// - "sin_ubicacion": la persona no compartió su ubicación.
/// - "sin_verificar": compartió ubicación pero el cuartel no tiene coords
///   cargadas, así que no se pudo calcular la distancia.
/// - "en_cuartel": verificada dentro del radio configurado.
/// - "fuera": verificada fuera del radio.
export type EstadoUbicacion =
  | "sin_ubicacion"
  | "sin_verificar"
  | "en_cuartel"
  | "fuera";

export function estadoUbicacion(f: {
  latitud: number | null;
  distanciaM: number | null;
  ubicacionVerificada: boolean;
}): EstadoUbicacion {
  if (f.latitud == null) return "sin_ubicacion";
  if (f.distanciaM == null) return "sin_verificar";
  return f.ubicacionVerificada ? "en_cuartel" : "fuera";
}

/// Distancia en metros entre dos coordenadas (fórmula de haversine).
export function distanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // radio terrestre en metros
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
