import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { alcanceVisibilidad, puedeCrearTareas } from "@/lib/permisos";
import { NOMBRE_ESTADO, COLOR_ESTADO, NOMBRE_PRIORIDAD } from "@/lib/dominio";

// Filtros de estado disponibles en la UI. "activas" oculta las completas.
const FILTROS = {
  activas: { label: "Activas", where: { estado: { in: ["PENDIENTE", "EN_REVISION"] } } },
  completas: { label: "Completas", where: { estado: "COMPLETA" } },
  todas: { label: "Todas", where: {} },
} satisfies Record<string, { label: string; where: Prisma.TareaWhereInput }>;

type Filtro = keyof typeof FILTROS;

type TareaLista = Prisma.TareaGetPayload<{
  include: { area: true; asignados: { include: { usuario: true } } };
}>;

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");

  const { estado } = await searchParams;
  const filtro: Filtro = estado && estado in FILTROS ? (estado as Filtro) : "activas";

  // Visibilidad: conducción ve todo; el resto ve lo general del dto, lo de sus
  // áreas y lo que tiene asignado o creó (PRD §3.5).
  const alcance = alcanceVisibilidad(ctx);
  const visibilidad: Prisma.TareaWhereInput =
    alcance.tipo === "DESTACAMENTO"
      ? { destacamentoId: ctx.destacamentoId }
      : {
          destacamentoId: ctx.destacamentoId,
          OR: [
            { asignados: { some: { usuarioId: ctx.usuarioId } } },
            { creadorId: ctx.usuarioId },
            ...(alcance.areaIds.length
              ? [{ areaId: { in: alcance.areaIds } }]
              : []),
          ],
        };

  const tareas = await prisma.tarea.findMany({
    where: { AND: [visibilidad, FILTROS[filtro].where] },
    include: { area: true, asignados: { include: { usuario: true } } },
    orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
  });

  // "Mis tareas" primero: separo las asignadas al usuario del resto.
  const esMia = (t: TareaLista) =>
    t.asignados.some((a) => a.usuarioId === ctx.usuarioId);
  const misTareas = tareas.filter(esMia);
  const otras = tareas.filter((t) => !esMia(t));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-500">
            ← Inicio
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Tareas
          </h1>
        </div>
        {puedeCrearTareas(ctx) && (
          <Link
            href="/tareas/nueva"
            className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white"
          >
            + Nueva
          </Link>
        )}
      </header>

      {/* Filtros */}
      <nav className="flex gap-2">
        {(Object.keys(FILTROS) as Filtro[]).map((f) => {
          const activo = f === filtro;
          return (
            <Link
              key={f}
              href={f === "activas" ? "/tareas" : `/tareas?estado=${f}`}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                activo
                  ? "bg-red-700 text-white"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {FILTROS[f].label}
            </Link>
          );
        })}
      </nav>

      {tareas.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">No hay tareas.</p>
      ) : misTareas.length > 0 ? (
        <>
          <Grupo titulo="Mis tareas" tareas={misTareas} />
          {otras.length > 0 && <Grupo titulo="Otras" tareas={otras} />}
        </>
      ) : (
        <ListaTareas tareas={otras} />
      )}
    </main>
  );
}

function Grupo({ titulo, tareas }: { titulo: string; tareas: TareaLista[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-zinc-500">{titulo}</h2>
      <ListaTareas tareas={tareas} />
    </section>
  );
}

function ListaTareas({ tareas }: { tareas: TareaLista[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {tareas.map((t) => (
        <li key={t.id}>
          <Link
            href={`/tareas/${t.id}`}
            className="block rounded-xl bg-white p-3 shadow-sm transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {t.titulo}
              </span>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs ${COLOR_ESTADO[t.estado]}`}
              >
                {NOMBRE_ESTADO[t.estado]}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {t.area ? t.area.nombre : "General"} · Prioridad{" "}
              {NOMBRE_PRIORIDAD[t.prioridad]}
              {t.asignados.length > 0 &&
                ` · ${t.asignados.map((a) => a.usuario.apellido).join(", ")}`}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
