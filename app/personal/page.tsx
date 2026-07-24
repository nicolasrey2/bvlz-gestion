import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeGestionarUsuarios } from "@/lib/permisos";
import { NOMBRE_ROL, nombreRango } from "@/lib/dominio";

export default async function PersonalPage() {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  // El ABM de personal es solo de la conducción del destacamento (PRD §3.5).
  if (!puedeGestionarUsuarios(ctx)) redirect("/");

  const usuarios = await prisma.usuario.findMany({
    where: { destacamentoId: ctx.destacamentoId },
    include: {
      asignaciones: { where: { vigenteHasta: null }, include: { area: true } },
    },
    orderBy: [{ activo: "desc" }, { apellido: "asc" }],
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-500">
            ← Inicio
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Personal
          </h1>
        </div>
        <Link
          href="/personal/nuevo"
          className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white"
        >
          + Nuevo
        </Link>
      </header>

      <ul className="flex flex-col gap-2">
        {usuarios.map((u) => (
          <li key={u.id}>
            <Link
              href={`/personal/${u.id}`}
              className="block rounded-xl bg-white p-3 shadow-sm transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {u.apellido}, {u.nombre}
              </span>
              <span className="flex shrink-0 gap-1">
                {!u.cuentaActivada && (
                  <span className="rounded bg-amber-200 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                    pendiente
                  </span>
                )}
                {!u.activo && (
                  <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    inactivo
                  </span>
                )}
              </span>
            </div>
            <p className="text-sm text-zinc-500">{nombreRango(u.rango)}</p>
            {u.asignaciones.length > 0 && (
              <p className="mt-1 text-xs text-zinc-500">
                {u.asignaciones
                  .map(
                    (a) =>
                      (NOMBRE_ROL[a.rol] ?? a.rol) +
                      (a.area ? ` (${a.area.nombre})` : ""),
                  )
                  .join(" · ")}
              </p>
            )}
            </Link>
          </li>
        ))}
      </ul>

      {usuarios.length === 0 && (
        <p className="text-center text-sm text-zinc-500">
          Todavía no hay personal cargado.
        </p>
      )}
    </main>
  );
}
