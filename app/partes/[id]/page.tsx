import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { esConduccion } from "@/lib/permisos";
import { NOMBRE_TIPO_SINIESTRO, NOMBRE_ESTADO_PARTE } from "@/lib/dominio";
import { cerrarParte } from "@/server/partes";
import { fmtFechaDia, fmtFechaHora } from "@/lib/fechas";

/// Clases de color del badge de estado (ABIERTO ámbar, CERRADO verde).
const COLOR_ESTADO_PARTE = {
  ABIERTO: "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
  CERRADO: "bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-100",
} as const;

export default async function DetallePartePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  const { id } = await params;

  const parte = await prisma.parteIntervencion.findFirst({
    where: { id, destacamentoId: ctx.destacamentoId },
    include: { creador: true, cerradoPor: true },
  });
  if (!parte) redirect("/partes");

  const personal = Array.isArray(parte.personal)
    ? (parte.personal as unknown[]).map(String)
    : [];

  const puedeCerrar =
    parte.estado === "ABIERTO" &&
    (parte.creadorId === ctx.usuarioId || esConduccion(ctx));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 p-6">
      <header>
        <Link href="/partes" className="text-sm text-zinc-500">
          ← Partes
        </Link>
        <div className="mt-1 flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {NOMBRE_TIPO_SINIESTRO[parte.tipoSiniestro]}
          </h1>
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-xs ${COLOR_ESTADO_PARTE[parte.estado]}`}
          >
            {NOMBRE_ESTADO_PARTE[parte.estado]}
          </span>
        </div>
      </header>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <dl className="flex flex-col gap-2 text-sm">
          {parte.servicioNro && <Dato titulo="N° de servicio" valor={parte.servicioNro} />}
          {parte.cuartel && <Dato titulo="Cuartel" valor={parte.cuartel} />}
          {parte.fecha && <Dato titulo="Fecha" valor={fmtFechaDia(parte.fecha)} />}
          {parte.objeto && <Dato titulo="Objeto" valor={parte.objeto} />}
          {parte.direccion && <Dato titulo="Dirección" valor={parte.direccion} />}
          {parte.localidad && <Dato titulo="Localidad" valor={parte.localidad} />}
          {(parte.horaAviso || parte.horaLlegada || parte.horaRegreso) && (
            <Dato
              titulo="Tiempos"
              valor={[
                parte.horaAviso && `Aviso ${parte.horaAviso}`,
                parte.horaLlegada && `Llegada ${parte.horaLlegada}`,
                parte.horaRegreso && `Regreso ${parte.horaRegreso}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          )}
          {(parte.dotaciones !== null || parte.bomberos !== null) && (
            <Dato
              titulo="Recursos"
              valor={[
                parte.dotaciones !== null && `${parte.dotaciones} dotaciones`,
                parte.bomberos !== null && `${parte.bomberos} bomberos`,
                parte.unidades,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          )}
          <Dato
            titulo="Creado por"
            valor={`${parte.creador.apellido}, ${parte.creador.nombre}`}
          />
          {parte.estado === "CERRADO" && parte.cerradoPor && parte.cerradoEn && (
            <Dato
              titulo="Cerrado por"
              valor={`${parte.cerradoPor.apellido} · ${fmtFechaHora(parte.cerradoEn)}`}
            />
          )}
        </dl>

        {parte.descripcion && (
          <p className="mt-3 border-t border-zinc-100 pt-3 text-sm whitespace-pre-wrap text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
            {parte.descripcion}
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-semibold text-zinc-500">Personal</h2>
        {personal.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            {personal.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400 italic">Sin personal cargado.</p>
        )}
      </section>

      {(parte.datosTomadosPor || parte.oficialActuante || parte.jefeCuerpo) && (
        <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold text-zinc-500">Firmas</h2>
          <dl className="flex flex-col gap-2 text-sm">
            {parte.datosTomadosPor && (
              <Dato titulo="Datos tomados por" valor={parte.datosTomadosPor} />
            )}
            {parte.oficialActuante && (
              <Dato titulo="Oficial actuante" valor={parte.oficialActuante} />
            )}
            {parte.jefeCuerpo && <Dato titulo="Jefe del Cuerpo" valor={parte.jefeCuerpo} />}
          </dl>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <a
          href={`/partes/${parte.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-center text-base font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          Descargar PDF
        </a>

        {puedeCerrar && (
          <form action={cerrarParte}>
            <input type="hidden" name="parteId" value={parte.id} />
            <button className="w-full rounded-lg bg-red-700 px-4 py-2.5 text-base font-semibold text-white">
              Cerrar parte — no se podrá editar
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-400">{titulo}</dt>
      <dd className="text-right text-zinc-800 dark:text-zinc-200">{valor}</dd>
    </div>
  );
}
