import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeGestionarUsuarios } from "@/lib/permisos";
import { FormNuevoUsuario } from "@/components/FormNuevoUsuario";

export default async function NuevoUsuarioPage() {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  if (!puedeGestionarUsuarios(ctx)) redirect("/");

  const areas = await prisma.area.findMany({
    where: { destacamentoId: ctx.destacamentoId },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 p-6">
      <header>
        <Link href="/personal" className="text-sm text-zinc-500">
          ← Personal
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Nuevo usuario
        </h1>
      </header>
      <FormNuevoUsuario areas={areas} />
    </main>
  );
}
