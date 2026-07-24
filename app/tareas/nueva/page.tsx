import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeCrearTareas, esConduccion, areasQueEncarga } from "@/lib/permisos";
import { FormNuevaTarea } from "@/components/FormNuevaTarea";

export default async function NuevaTareaPage() {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  if (!puedeCrearTareas(ctx)) redirect("/");

  const conduccion = esConduccion(ctx);

  // Conducción crea en cualquier área (o general); el encargado solo en las suyas.
  const areas = await prisma.area.findMany({
    where: conduccion
      ? { destacamentoId: ctx.destacamentoId }
      : { destacamentoId: ctx.destacamentoId, id: { in: areasQueEncarga(ctx) } },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });

  const usuarios = await prisma.usuario.findMany({
    where: { destacamentoId: ctx.destacamentoId, activo: true },
    orderBy: [{ apellido: "asc" }],
    select: { id: true, nombre: true, apellido: true },
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 p-6">
      <header>
        <Link href="/tareas" className="text-sm text-zinc-500">
          ← Tareas
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Nueva tarea
        </h1>
      </header>
      <FormNuevaTarea
        areas={areas}
        usuarios={usuarios}
        permiteGeneral={conduccion}
      />
    </main>
  );
}
