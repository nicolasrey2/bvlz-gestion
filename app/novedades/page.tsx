import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { esConduccion } from "@/lib/permisos";
import {
  NOMBRE_TIPO_NOVEDAD,
  NOMBRE_TIPO_GUARDIA,
  NOMBRE_TIPO_SINIESTRO,
  TIPOS_NOVEDAD,
} from "@/lib/dominio";
import { fmtFechaHora, fmtFechaDia } from "@/lib/fechas";
import { FormNuevaNovedad } from "@/components/FormNuevaNovedad";
import { AccionesNovedad } from "@/components/AccionesNovedad";
import type { TipoNovedad } from "@/generated/prisma/client";

// Ventanas de tiempo disponibles para "Cargar más" (en días hacia atrás).
const PASOS_DIAS = [30, 60, 90, 180] as const;
const DIAS_DEFECTO: number = PASOS_DIAS[0];

// Cuántos registros pedimos de cada origen, sin importar la ventana elegida:
// es el límite real de rendimiento (evita traer historiales enteros).
const TAKE_POR_ORIGEN = 50;

function parseDias(raw: string | undefined): number {
  const n = Number(raw);
  return (PASOS_DIAS as readonly number[]).includes(n) ? n : DIAS_DEFECTO;
}

// Una entrada unificada de la línea de tiempo, sin importar su origen.
// `novedad` solo está presente en las entradas manuales; es lo que necesita
// AccionesNovedad para poder editar/eliminar.
type EntradaTimeline = {
  fecha: Date;
  tipoTexto: string;
  detalle: string;
  esManual: boolean;
  novedad?: { id: string; autorId: string; tipo: TipoNovedad; texto: string };
};

export default async function NovedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");

  const { dias: diasRaw } = await searchParams;
  const dias = parseDias(diasRaw);

  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const [novedades, fichadas, intercambios, guardias, partesCerrados] =
    await Promise.all([
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
      prisma.guardia.findMany({
        where: { destacamentoId: ctx.destacamentoId, createdAt: { gte: desde } },
        orderBy: { createdAt: "desc" },
        take: TAKE_POR_ORIGEN,
      }),
      // cerradoEn gte desde ya excluye los partes todavía abiertos (cerradoEn null).
      prisma.parteIntervencion.findMany({
        where: { destacamentoId: ctx.destacamentoId, cerradoEn: { gte: desde } },
        include: { cerradoPor: true },
        orderBy: { cerradoEn: "desc" },
        take: TAKE_POR_ORIGEN,
      }),
    ]);

  // Unifico los cinco orígenes en una sola línea de tiempo cronológica.
  const timeline: EntradaTimeline[] = [
    ...novedades.map((n) => ({
      fecha: n.createdAt,
      tipoTexto: NOMBRE_TIPO_NOVEDAD[n.tipo],
      detalle: `${n.texto} — ${n.autor.apellido}, ${n.autor.nombre}`,
      esManual: true,
      novedad: { id: n.id, autorId: n.autorId, tipo: n.tipo, texto: n.texto },
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
    ...guardias.map((g) => ({
      fecha: g.createdAt,
      tipoTexto: "Alta de guardia",
      detalle: `Se cargó guardia ${NOMBRE_TIPO_GUARDIA[g.tipo]} del ${fmtFechaDia(g.fecha)}`,
      esManual: false,
    })),
    ...partesCerrados.map((p) => ({
      // El filtro de arriba garantiza cerradoEn no nulo para estas filas.
      fecha: p.cerradoEn as Date,
      tipoTexto: "Cierre de parte",
      detalle: `Se cerró parte de ${NOMBRE_TIPO_SINIESTRO[p.tipoSiniestro]}${
        p.cerradoPor ? ` — ${p.cerradoPor.apellido}, ${p.cerradoPor.nombre}` : ""
      }`,
      esManual: false,
    })),
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  const siguientePaso = PASOS_DIAS.find((p) => p > dias);
  const puedeModerar = esConduccion(ctx);

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

      {timeline.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">
          No hay novedades registradas.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {timeline.map((e, i) => (
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
              {e.novedad &&
                (e.novedad.autorId === ctx.usuarioId || puedeModerar) && (
                  <AccionesNovedad
                    id={e.novedad.id}
                    tipo={e.novedad.tipo}
                    texto={e.novedad.texto}
                    tipos={TIPOS_NOVEDAD}
                  />
                )}
            </li>
          ))}
        </ul>
      )}

      <footer className="flex flex-col items-center gap-1 py-2">
        <p className="text-xs text-zinc-400">Mostrando los últimos {dias} días</p>
        {siguientePaso && (
          <Link
            href={`/novedades?dias=${siguientePaso}`}
            className="text-sm font-medium text-red-700 underline dark:text-red-400"
          >
            Cargar más (últimos {siguientePaso} días)
          </Link>
        )}
      </footer>
    </main>
  );
}
