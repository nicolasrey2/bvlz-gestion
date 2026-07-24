import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeGestionarGuardias } from "@/lib/permisos";
import { FormEditarGuardia } from "@/components/FormEditarGuardia";

export default async function EditarGuardiaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  if (!puedeGestionarGuardias(ctx)) redirect("/guardias");

  const { id } = await params;

  // La guardia tiene que existir y ser del destacamento del usuario.
  const guardia = await prisma.guardia.findFirst({
    where: { id, destacamentoId: ctx.destacamentoId },
    include: { participantes: true },
  });
  if (!guardia) notFound();

  const usuarios = await prisma.usuario.findMany({
    where: { destacamentoId: ctx.destacamentoId, activo: true },
    orderBy: [{ apellido: "asc" }],
    select: { id: true, nombre: true, apellido: true },
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-4 p-6">
      <header>
        <Link href="/guardias" className="text-sm text-zinc-500">
          ← Guardias
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Editar guardia
        </h1>
      </header>
      <FormEditarGuardia
        guardia={{
          id: guardia.id,
          tipo: guardia.tipo,
          fecha: guardia.fecha,
          cuarteleroNombre: guardia.cuarteleroNombre,
          notas: guardia.notas,
          participantesIds: guardia.participantes.map((p) => p.usuarioId),
        }}
        usuarios={usuarios}
      />
    </main>
  );
}
