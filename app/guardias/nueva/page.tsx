import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeGestionarGuardias } from "@/lib/permisos";
import { FormNuevaGuardia } from "@/components/FormNuevaGuardia";

export default async function NuevaGuardiaPage() {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  if (!puedeGestionarGuardias(ctx)) redirect("/guardias");

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
          Nueva guardia
        </h1>
      </header>
      <FormNuevaGuardia usuarios={usuarios} />
    </main>
  );
}
