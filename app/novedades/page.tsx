import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { NOMBRE_TIPO_NOVEDAD, TIPOS_NOVEDAD } from "@/lib/dominio";
import { fmtFechaHora } from "@/lib/fechas";
import { FormNuevaNovedad } from "@/components/FormNuevaNovedad";

// Cuánto atrás mostramos en la bitácora, y cuántas entradas como máximo.
const DIAS_ATRAS = 30;
const MAX_ENTRADAS = 80;
// Cuántos registros pedimos de cada origen antes de unificar y recortar.
const TAKE_POR_ORIGEN = 50;

// Una entrada unificada de la línea de tiempo, sin importar su origen.
type EntradaTimeline = {
  fecha: Date;
  tipoTexto: string;
  detalle: string;
  esManual: boolean;
};

export default async function NovedadesPage() {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");

  const desde = new Date();
  desde.setDate(desde.getDate() - DIAS_ATRAS);

  const [novedades, fichadas, intercambios] = await Promise.all([
    prisma.novedad.findMany({
      where: { destacamentoId: ctx.destacamentoId, createdAt: { gte: desde } },
      include: { autor: true },
      orderBy: { createdAt: "desc" },
      take: TAKE_POR_ORIGEN,
    }),
    prisma.fichada.findMany({
      where: { destacamentoId: ctx.destacamentoId, momento: { gte: desde } },
      include: { usuario: true },
      orderBy: { momento: "desc" },
      take: TAKE_POR_ORIGEN,
    }),
    prisma.intercambioGuardia.findMany({
      where: {
        guardia: { destacamentoId: ctx.destacamentoId },
        createdAt: { gte: desde },
      },
      orderBy: { createdAt: "desc" },
      take: TAKE_POR_ORIGEN,
    }),
  ]);

  // Unifico los tres orígenes en una sola línea de tiempo cronológica.
  const timeline: EntradaTimeline[] = [
    ...novedades.map((n) => ({
      fecha: n.createdAt,
      tipoTexto: NOMBRE_TIPO_NOVEDAD[n.tipo],
      detalle: `${n.texto} — ${n.autor.apellido}, ${n.autor.nombre}`,
      esManual: true,
    })),
    ...fichadas.map((f) => ({
      fecha: f.momento,
      tipoTexto: f.tipo === "ENTRADA" ? "Fichó entrada" : "Fichó salida",
      detalle: `${f.usuario.apellido}, ${f.usuario.nombre}${
        f.noProgramada ? " (guardia no programada)" : ""
      }`,
      esManual: false,
    })),
    ...intercambios.map((i) => ({
      fecha: i.createdAt,
      tipoTexto: "Intercambio de guardia",
      detalle: `${i.deNombre} → ${i.aNombre}`,
      esManual: false,
    })),
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  const entradas = timeline.slice(0, MAX_ENTRADAS);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 p-6">
      <header>
        <Link href="/" className="text-sm text-zinc-500">
          ← Inicio
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Novedades
        </h1>
      </header>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <FormNuevaNovedad tipos={TIPOS_NOVEDAD} />
      </section>

      {entradas.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">
          No hay novedades registradas.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entradas.map((e, i) => (
            <li
              key={i}
              className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={
                    e.esManual
                      ? "shrink-0 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-100"
                      : "shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  }
                >
                  {e.tipoTexto}
                </span>
                <time className="shrink-0 text-xs text-zinc-400">
                  {fmtFechaHora(e.fecha)}
                </time>
              </div>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                {e.detalle}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
