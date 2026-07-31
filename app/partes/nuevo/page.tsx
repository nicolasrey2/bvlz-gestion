import Link from "next/link";
import { redirect } from "next/navigation";
import { getContextoAuth } from "@/lib/auth";
import { puedeCrearParte } from "@/lib/permisos";
import { crearParte } from "@/server/partes";
import { sugerenciasDePersonal } from "@/server/partePersonalSugerencias";
import { FormParte } from "@/components/FormParte";

export default async function NuevoPartePage() {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  if (!puedeCrearParte(ctx)) redirect("/");

  const sugerenciasPersonal = await sugerenciasDePersonal(ctx.destacamentoId);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-4 p-6">
      <header>
        <Link href="/partes" className="text-sm text-zinc-500">
          ← Partes
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Nuevo parte de intervención
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Se puede abrir con lo que se sepa ahora: mientras el parte esté
          abierto se puede seguir editando.
        </p>
      </header>
      <FormParte accion={crearParte} sugerenciasPersonal={sugerenciasPersonal} />
    </main>
  );
}
