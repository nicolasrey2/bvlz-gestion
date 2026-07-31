import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeCrearParte } from "@/lib/permisos";
import { nombreRango } from "@/lib/dominio";
import { FormNuevoParte } from "@/components/FormNuevoParte";

export default async function NuevoPartePage() {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  if (!puedeCrearParte(ctx)) redirect("/");

  // Personal activo del destacamento, para autocompletar la carga del parte
  // (P6). Se arma "Jerarquía Apellido" —el formato de la columna del
  // formulario oficial— para que la sugerencia se pueda usar tal cual.
  const personal = await prisma.usuario.findMany({
    where: { destacamentoId: ctx.destacamentoId, activo: true },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    select: { id: true, apellido: true, rango: true },
  });
  const sugerenciasPersonal = personal.map((p) => ({
    usuarioId: p.id,
    nombre: `${nombreRango(p.rango)} ${p.apellido}`,
  }));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-4 p-6">
      <header>
        <Link href="/partes" className="text-sm text-zinc-500">
          ← Partes
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Nuevo parte de intervención
        </h1>
      </header>
      <FormNuevoParte sugerenciasPersonal={sugerenciasPersonal} />
    </main>
  );
}
