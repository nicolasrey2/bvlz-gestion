import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import {
  esConduccion,
  alcanceVisibilidad,
  puedeAprobarTareaEnArea,
} from "@/lib/permisos";
import {
  NOMBRE_ESTADO,
  COLOR_ESTADO,
  NOMBRE_PRIORIDAD,
} from "@/lib/dominio";
import {
  enviarARevision,
  aprobarTarea,
  rechazarTarea,
} from "@/server/tareas";

function fecha(d: Date) {
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function DetalleTareaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  const { id } = await params;

  const tarea = await prisma.tarea.findFirst({
    where: { id, destacamentoId: ctx.destacamentoId },
    include: {
      area: true,
      creador: true,
      aprobador: true,
      asignados: { include: { usuario: true } },
    },
  });
  if (!tarea) redirect("/tareas");

  // Control de visibilidad (además del filtro de la lista).
  const alcance = alcanceVisibilidad(ctx);
  const esAsignado = tarea.asignados.some((a) => a.usuarioId === ctx.usuarioId);
  const puedeVer =
    alcance.tipo === "DESTACAMENTO" ||
    esAsignado ||
    tarea.creadorId === ctx.usuarioId ||
    (tarea.areaId !== null && alcance.areaIds.includes(tarea.areaId));
  if (!puedeVer) redirect("/tareas");

  const puedeAprobar = puedeAprobarTareaEnArea(ctx, tarea.areaId);
  const puedeEnviar = esAsignado || esConduccion(ctx) || puedeAprobar;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 p-6">
      <header>
        <Link href="/tareas" className="text-sm text-zinc-500">
          ← Tareas
        </Link>
        <div className="mt-1 flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {tarea.titulo}
          </h1>
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-xs ${COLOR_ESTADO[tarea.estado]}`}
          >
            {NOMBRE_ESTADO[tarea.estado]}
          </span>
        </div>
      </header>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <dl className="flex flex-col gap-2 text-sm">
          <Dato titulo="Área" valor={tarea.area ? tarea.area.nombre : "General"} />
          <Dato titulo="Prioridad" valor={NOMBRE_PRIORIDAD[tarea.prioridad]} />
          {tarea.fechaLimite && (
            <Dato titulo="Fecha límite" valor={fecha(tarea.fechaLimite)} />
          )}
          <Dato
            titulo="Responsables"
            valor={
              tarea.asignados.length > 0
                ? tarea.asignados
                    .map((a) => `${a.usuario.apellido}, ${a.usuario.nombre}`)
                    .join(" · ")
                : "sin asignar"
            }
          />
          <Dato
            titulo="Creada por"
            valor={`${tarea.creador.apellido}, ${tarea.creador.nombre}`}
          />
          {tarea.estado === "COMPLETA" && tarea.aprobador && tarea.aprobadaEn && (
            <Dato
              titulo="Aprobada por"
              valor={`${tarea.aprobador.apellido} · ${fecha(tarea.aprobadaEn)}`}
            />
          )}
        </dl>
        {tarea.descripcion && (
          <p className="mt-3 border-t border-zinc-100 pt-3 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
            {tarea.descripcion}
          </p>
        )}
      </section>

      {/* Transiciones de estado */}
      <section className="flex flex-col gap-2">
        {tarea.estado === "PENDIENTE" && puedeEnviar && (
          <form action={enviarARevision}>
            <input type="hidden" name="tareaId" value={tarea.id} />
            <button className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-base font-semibold text-white">
              Marcar como hecha (enviar a revisión)
            </button>
          </form>
        )}

        {tarea.estado === "EN_REVISION" && puedeAprobar && (
          <div className="flex gap-2">
            <form action={aprobarTarea} className="flex-1">
              <input type="hidden" name="tareaId" value={tarea.id} />
              <button className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-base font-semibold text-white">
                Aprobar
              </button>
            </form>
            <form action={rechazarTarea} className="flex-1">
              <input type="hidden" name="tareaId" value={tarea.id} />
              <button className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-base font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                Rechazar
              </button>
            </form>
          </div>
        )}

        {tarea.estado === "EN_REVISION" && !puedeAprobar && (
          <p className="text-center text-sm text-zinc-500">
            En revisión — esperando el visto bueno del encargado.
          </p>
        )}
      </section>
    </main>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-400">{titulo}</dt>
      <dd className="text-right text-zinc-800 dark:text-zinc-200">{valor}</dd>
    </div>
  );
}
