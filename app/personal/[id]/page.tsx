import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeGestionarUsuarios } from "@/lib/permisos";
import { RANGOS, NOMBRE_ROL } from "@/lib/dominio";
import {
  cambiarRango,
  cambiarEstadoUsuario,
  finalizarRol,
} from "@/server/personal";
import { FormAsignarRol } from "@/components/FormAsignarRol";
import { RegenerarActivacion } from "@/components/RegenerarActivacion";
import { FormEditarContacto } from "@/components/FormEditarContacto";
import { ResetearPassword } from "@/components/ResetearPassword";
import { CambiarEmail } from "@/components/CambiarEmail";
import { fmtFecha } from "@/lib/fechas";
import { BotonAccion } from "@/components/BotonAccion";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

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
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 p-6">
      <header>
        <Link href="/personal" className="text-sm text-zinc-500">
          ← Personal
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {usuario.apellido}, {usuario.nombre}
        </h1>
        <p className="text-sm text-zinc-500">{usuario.email}</p>
      </header>

      {!usuario.cuentaActivada && (
        <section className="rounded-2xl bg-amber-50 p-4 shadow-sm dark:bg-amber-950/30">
          <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Cuenta pendiente de activación
          </h2>
          <p className="mt-1 mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            Todavía no definió su contraseña. Generá el link y compartíselo.
          </p>
          <RegenerarActivacion usuarioId={usuario.id} />
        </section>
      )}

      {/* Seguridad: reseteo de contraseña (solo cuentas ya activadas; las
          pendientes ya tienen su link arriba, vía RegenerarActivacion). */}
      {usuario.cuentaActivada && (
        <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold text-zinc-500">
            Seguridad
          </h2>
          <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            Si la persona perdió el acceso a su cuenta, podés resetear la
            contraseña y compartirle un nuevo link para que defina una nueva.
          </p>
          <ResetearPassword usuarioId={usuario.id} />
        </section>
      )}

      {/* Email de acceso: es con lo que la persona inicia sesión, por eso va
          separado de los datos de contacto. */}
      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-semibold text-zinc-500">
          Email de acceso
        </h2>
        <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
          Con este email inicia sesión. Cambiarlo no modifica su contraseña.
        </p>
        <CambiarEmail usuarioId={usuario.id} email={usuario.email} />
      </section>

      {/* Datos de contacto */}
      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-semibold text-zinc-500">
          Datos de contacto
        </h2>
        <FormEditarContacto
          usuarioId={usuario.id}
          nombre={usuario.nombre}
          apellido={usuario.apellido}
          legajo={usuario.legajo}
          dni={usuario.dni}
          telefono={usuario.telefono}
        />
      </section>

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
          <BotonAccion
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
            pendiente="Guardando…"
          >
            Guardar
          </BotonAccion>
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
                  <BotonAccion
                    className="text-xs font-medium text-red-700 underline"
                    pendiente="Finalizando…"
                  >
                    Finalizar
                  </BotonAccion>
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
                {etiquetaRol(a)} — {fmtFecha(a.vigenteDesde)} a{" "}
                {a.vigenteHasta ? fmtFecha(a.vigenteHasta) : "—"}
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
            <BotonAccion
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
              pendiente="Guardando…"
            >
              {usuario.activo ? "Desactivar" : "Activar"}
            </BotonAccion>
          </form>
        </div>
      </section>
    </main>
  );
}
