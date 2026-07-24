import Link from "next/link";
import { redirect } from "next/navigation";
import { getContextoAuth } from "@/lib/auth";
import { puedeCrearParte } from "@/lib/permisos";
import { FormNuevoParte } from "@/components/FormNuevoParte";

export default async function NuevoPartePage() {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  if (!puedeCrearParte(ctx)) redirect("/");

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
      <FormNuevoParte />
    </main>
  );
}
