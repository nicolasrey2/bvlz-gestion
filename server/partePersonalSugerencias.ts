import { prisma } from "@/lib/prisma";
import { nombreRango } from "@/lib/dominio";
import type { SugerenciaPersonal } from "@/components/SelectorPersonal";

/// Personal activo del destacamento para autocompletar la carga del parte (P6).
///
/// Se arma "Jerarquía Apellido" —el formato de la columna del formulario
/// oficial— para que la sugerencia se pueda usar tal cual. Vive acá y no en la
/// página porque lo necesitan por igual el alta y la edición del parte.
export async function sugerenciasDePersonal(
  destacamentoId: string,
): Promise<SugerenciaPersonal[]> {
  const personal = await prisma.usuario.findMany({
    where: { destacamentoId, activo: true },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    select: { id: true, apellido: true, rango: true },
  });
  return personal.map((p) => ({
    usuarioId: p.id,
    nombre: `${nombreRango(p.rango)} ${p.apellido}`,
  }));
}
