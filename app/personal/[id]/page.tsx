import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeGestionarUsuarios } from "@/lib/permisos";
import { RANGOS, NOMBRE_ROL, nombreRango } from "@/lib/dominio";
import {
  cambiarRango,
  cambiarEstadoUsuario,
  finalizarRol,
} from "@/server/personal";
import { FormAsignarRol } from "@/components/FormAsignarRol";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

// Formato de fecha local (es-AR) para el historial.
function fecha(d: Date) {
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function DetalleUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  if (!puedeGestionarUsuarios(ctx)) redirect("/");

  const { id } = await params;

  const usuario = await prisma.usuario.findFirst({
    where: { id, destacamentoId: ctx.destacamentoId },
    include: {
      asignaciones: {
        include: { area: true },
        orderBy: [{ vigenteDesde: "desc" }],
      },
    },
  });
  if (!usuario) redirect("/personal");

  const areas = await prisma.area.findMany({
    where: { destacamentoId: ctx.destacamentoId },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });

  const vigentes = usuario.asignaciones.filter((a) => !a.vigenteHasta);
  const historicas = usuario.asignaciones.filter((a) => a.vigenteHasta);

  const etiquetaRol = (a: (typeof usuario.asignaciones)[number]) =>
    (NOMBRE_ROL[a.rol] ?? a.rol) + (a.area ? ` · ${a.area.nombre}` : "");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 p-6">
      <header>
        <Link href="/personal" className="text-sm text-zinc-500">
          ← Personal
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {usuario.apellido}, {usuario.nombre}
        </h1>
        <p className="text-sm text-zinc-500">{usuario.email}</p>
      </header>

      {/* Rango */}
      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-semibold text-zinc-500">Rango</h2>
        <form action={cambiarRango} className="flex items-center gap-2">
          <input type="hidden" name="usuarioId" value={usuario.id} />
          <select name="rango" defaultValue={usuario.rango} className={input}>
            {RANGOS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700">
            Guardar
          </button>
        </form>
      </section>

      {/* Roles vigentes */}
      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-semibold text-zinc-500">
          Roles vigentes
        </h2>
        {vigentes.length === 0 ? (
          <p className="text-sm text-zinc-400 italic">Sin roles vigentes.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {vigentes.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <span className="text-sm text-zinc-800 dark:text-zinc-200">
                  {etiquetaRol(a)}
                </span>
                <form action={finalizarRol}>
                  <input type="hidden" name="asignacionId" value={a.id} />
                  <input type="hidden" name="usuarioId" value={usuario.id} />
                  <button className="text-xs font-medium text-red-700 underline">
                    Finalizar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <p className="mb-2 text-xs font-semibold text-zinc-500">
            Asignar nuevo rol
          </p>
          <FormAsignarRol usuarioId={usuario.id} areas={areas} />
        </div>
      </section>

      {/* Historial de rotaciones */}
      {historicas.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold text-zinc-500">
            Historial
          </h2>
          <ul className="flex flex-col gap-1 text-xs text-zinc-500">
            {historicas.map((a) => (
              <li key={a.id}>
                {etiquetaRol(a)} — {fecha(a.vigenteDesde)} a{" "}
                {a.vigenteHasta ? fecha(a.vigenteHasta) : "—"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Estado */}
      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-500">Estado</h2>
            <p className="text-sm text-zinc-800 dark:text-zinc-200">
              {usuario.activo ? "Activo" : "Inactivo"}
            </p>
          </div>
          <form action={cambiarEstadoUsuario}>
            <input type="hidden" name="usuarioId" value={usuario.id} />
            <input
              type="hidden"
              name="activo"
              value={usuario.activo ? "false" : "true"}
            />
            <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700">
              {usuario.activo ? "Desactivar" : "Activar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
