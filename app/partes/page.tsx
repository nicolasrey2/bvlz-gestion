import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeCrearParte } from "@/lib/permisos";
import { NOMBRE_TIPO_SINIESTRO, NOMBRE_ESTADO_PARTE } from "@/lib/dominio";

/// Clases de color del badge de estado (ABIERTO ámbar, CERRADO verde).
const COLOR_ESTADO_PARTE = {
  ABIERTO: "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
  CERRADO: "bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-100",
} as const;

function fecha(d: Date) {
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function PartesPage() {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");

  const partes = await prisma.parteIntervencion.findMany({
    where: { destacamentoId: ctx.destacamentoId },
    include: { creador: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-500">
            ← Inicio
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Partes de intervención
          </h1>
        </div>
        {puedeCrearParte(ctx) && (
          <Link
            href="/partes/nuevo"
            className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white"
          >
            + Nuevo
          </Link>
        )}
      </header>

      {partes.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">
          No hay partes registrados.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {partes.map((p) => (
            <li key={p.id}>
              <Link
                href={`/partes/${p.id}`}
                className="block rounded-xl bg-white p-3 shadow-sm transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {NOMBRE_TIPO_SINIESTRO[p.tipoSiniestro]}
                  </span>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs ${COLOR_ESTADO_PARTE[p.estado]}`}
                  >
                    {NOMBRE_ESTADO_PARTE[p.estado]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {p.fecha ? fecha(p.fecha) : "sin fecha"}
                  {p.objeto && ` · ${p.objeto}`}
                  {` · ${p.creador.apellido}, ${p.creador.nombre}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
