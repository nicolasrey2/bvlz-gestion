import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeVerFichados } from "@/lib/permisos";
import { NOMBRE_TIPO_FICHADA } from "@/lib/dominio";
import { FormFichado } from "./FormFichado";
import { BadgeUbicacion } from "@/components/BadgeUbicacion";
import { fmtHora, hoyArgentina, rangoDiaAR, rangoDiaUTC, rangoMesAR } from "@/lib/fechas";
import {
  calcularMinutos,
  enServicio,
  formatearHoras,
  META_HORAS_MES,
  VENTANA_SERVICIO_MS,
  type FichadaMin,
} from "@/lib/servicio";

/// De una lista de fichadas (más reciente primero) de varios usuarios, se
/// queda con la última fichada de cada usuario. Sirve para derivar "quién
/// está en servicio ahora" sin una consulta por persona.
function ultimaPorUsuario<T extends { usuarioId: string }>(
  fichadas: T[],
): Map<string, T> {
  const porUsuario = new Map<string, T>();
  for (const f of fichadas) {
    if (!porUsuario.has(f.usuarioId)) porUsuario.set(f.usuarioId, f);
  }
  return porUsuario;
}

export default async function FichadoPage() {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");

  const { y, m, d } = hoyArgentina();
  // Guardias: fechas "día" (medianoche UTC). Fichadas: instantes (día AR).
  const diaUTC = rangoDiaUTC(y, m, d);
  const diaAR = rangoDiaAR(y, m, d);

  // ¿Le toca guardia interna hoy?
  const guardiaHoy = await prisma.guardia.findFirst({
    where: {
      destacamentoId: ctx.destacamentoId,
      tipo: "INTERNA",
      fecha: { gte: diaUTC.inicio, lt: diaUTC.fin },
      participantes: { some: { usuarioId: ctx.usuarioId } },
    },
  });

  const misFichadasHoy = await prisma.fichada.findMany({
    where: {
      usuarioId: ctx.usuarioId,
      momento: { gte: diaAR.inicio, lt: diaAR.fin },
    },
    orderBy: { momento: "asc" },
  });

  // Registro del día para oficina/encargado.
  const verRegistro = puedeVerFichados(ctx);
  const registroHoy = verRegistro
    ? await prisma.fichada.findMany({
        where: {
          destacamentoId: ctx.destacamentoId,
          momento: { gte: diaAR.inicio, lt: diaAR.fin },
        },
        include: { usuario: true },
        orderBy: { momento: "desc" },
      })
    : [];

  // "En servicio ahora": última fichada de cada usuario dentro de la ventana
  // reciente; si esa última es una ENTRADA vigente, la persona está adentro.
  // Visible para todo el personal (no solo conducción).
  const ahora = new Date();
  const fichadasRecientes = await prisma.fichada.findMany({
    where: {
      destacamentoId: ctx.destacamentoId,
      momento: { gte: new Date(ahora.getTime() - VENTANA_SERVICIO_MS) },
    },
    include: { usuario: true },
    orderBy: { momento: "desc" },
  });
  const enServicioAhora = [...ultimaPorUsuario(fichadasRecientes).values()].filter(
    (f) => enServicio(f as FichadaMin, ahora),
  );

  // Horas del mes: fichadas propias del mes AR en curso, emparejadas
  // ENTRADA→SALIDA (turno abierto cuenta hasta ahora).
  const mesActual = rangoMesAR(y, m);
  const misFichadasMes = await prisma.fichada.findMany({
    where: {
      usuarioId: ctx.usuarioId,
      momento: { gte: mesActual.inicio, lt: mesActual.fin },
    },
  });
  const minutosMes = calcularMinutos(misFichadasMes, ahora);
  const cumpleMeta = minutosMes / 60 >= META_HORAS_MES;

  // El geo-fichado solo puede verificar si el cuartel tiene coords cargadas.
  const destacamento = await prisma.destacamento.findUnique({
    where: { id: ctx.destacamentoId },
    select: { latitud: true, longitud: true },
  });
  const geoActivo =
    destacamento?.latitud != null && destacamento?.longitud != null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 p-6">
      <header>
        <Link href="/" className="text-sm text-zinc-500">
          ← Inicio
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Fichado
        </h1>
        <p className="text-sm text-zinc-500">
          {guardiaHoy
            ? "Hoy tenés guardia interna asignada."
            : "Hoy no tenés guardia asignada (se registrará como no programada)."}
        </p>
      </header>

      {!geoActivo && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          El geo-fichado no está activo: falta cargar la ubicación del cuartel
          {verRegistro && (
            <>
              {" · "}
              <Link href="/destacamento" className="underline">
                configurar
              </Link>
            </>
          )}
          .
        </p>
      )}

      {/* En servicio ahora: visible para todo el personal. */}
      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-semibold text-zinc-500">
          En servicio ahora
        </h2>
        {enServicioAhora.length === 0 ? (
          <p className="text-sm text-zinc-400 italic">
            Nadie está en servicio en este momento.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-zinc-800 dark:text-zinc-200">
            {enServicioAhora.map((f) => (
              <li key={f.usuarioId} className="flex flex-wrap items-center justify-between gap-1">
                <span>
                  {f.usuario.apellido}, {f.usuario.nombre}
                  {f.noProgramada && (
                    <span className="ml-2 text-xs text-amber-600">
                      no programada
                    </span>
                  )}
                  <BadgeUbicacion fichada={f} />
                </span>
                <span className="text-zinc-500">desde {fmtHora(f.momento)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Botones de fichado */}
      <FormFichado />

      {/* Horas del mes (propias). */}
      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-semibold text-zinc-500">
          Horas del mes
        </h2>
        <p className="mb-2 text-sm text-zinc-800 dark:text-zinc-200">
          Tus horas este mes: {formatearHoras(minutosMes)} de {META_HORAS_MES}h
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full ${cumpleMeta ? "bg-green-600" : "bg-red-700"}`}
            style={{
              width: `${Math.min(100, (minutosMes / 60 / META_HORAS_MES) * 100)}%`,
            }}
          />
        </div>
      </section>

      {/* Mis fichadas de hoy */}
      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-semibold text-zinc-500">
          Mis fichadas de hoy
        </h2>
        {misFichadasHoy.length === 0 ? (
          <p className="text-sm text-zinc-400 italic">Todavía no fichaste hoy.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-zinc-800 dark:text-zinc-200">
            {misFichadasHoy.map((f) => (
              <li key={f.id} className="flex justify-between">
                <span>
                  {NOMBRE_TIPO_FICHADA[f.tipo]}
                  {f.noProgramada && (
                    <span className="ml-2 text-xs text-amber-600">
                      no programada
                    </span>
                  )}
                  <BadgeUbicacion fichada={f} />
                </span>
                <span className="text-zinc-500">{fmtHora(f.momento)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Registro del día (oficina/encargado) */}
      {verRegistro && (
        <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold text-zinc-500">
            Registro de hoy (todo el personal)
          </h2>
          {registroHoy.length === 0 ? (
            <p className="text-sm text-zinc-400 italic">Sin fichadas hoy.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {registroHoy.map((f) => (
                <li
                  key={f.id}
                  className="flex justify-between text-zinc-800 dark:text-zinc-200"
                >
                  <span>
                    {f.usuario.apellido}, {f.usuario.nombre} ·{" "}
                    {NOMBRE_TIPO_FICHADA[f.tipo]}
                    {f.noProgramada && (
                      <span className="ml-1 text-xs text-amber-600">(NP)</span>
                    )}
                    <BadgeUbicacion fichada={f} mostrarEnCuartel mostrarDistancia />
                  </span>
                  <span className="text-zinc-500">{fmtHora(f.momento)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
