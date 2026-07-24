import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { esConduccion, puedeCrearTareaEnArea, areasQueEncarga } from "@/lib/permisos";
import { FormEditarTarea } from "@/components/FormEditarTarea";

export default async function EditarTareaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  const { id } = await params;

  // La tarea tiene que existir y ser del destacamento del usuario.
  const tarea = await prisma.tarea.findFirst({
    where: { id, destacamentoId: ctx.destacamentoId },
  });
  if (!tarea) notFound();

  // Una tarea completa no se edita; y solo puede editar quien puede
  // crear/asignar en esa área (o conducción) — PRD §3.5/§4.3.
  if (tarea.estado === "COMPLETA" || !puedeCrearTareaEnArea(ctx, tarea.areaId)) {
    redirect(`/tareas/${tarea.id}`);
  }

  const conduccion = esConduccion(ctx);

  // Mismo criterio que en el alta: conducción puede mover a cualquier área
  // (o general); el encargado solo entre las suyas.
  const areas = await prisma.area.findMany({
    where: conduccion
      ? { destacamentoId: ctx.destacamentoId }
      : { destacamentoId: ctx.destacamentoId, id: { in: areasQueEncarga(ctx) } },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-4 p-6">
      <header>
        <Link href={`/tareas/${tarea.id}`} className="text-sm text-zinc-500">
          ← Tarea
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Editar tarea
        </h1>
      </header>
      <FormEditarTarea
        tarea={{
          id: tarea.id,
          titulo: tarea.titulo,
          descripcion: tarea.descripcion,
          prioridad: tarea.prioridad,
          areaId: tarea.areaId,
          fechaLimite: tarea.fechaLimite,
        }}
        areas={areas}
        permiteGeneral={conduccion}
      />
    </main>
  );
}
