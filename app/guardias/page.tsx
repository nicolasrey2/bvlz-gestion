import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeGestionarGuardias } from "@/lib/permisos";
import { NOMBRE_TIPO_GUARDIA, horarioGuardia } from "@/lib/dominio";
import { eliminarGuardia } from "@/server/guardias";
import { CederGuardia } from "@/components/CederGuardia";
import { BotonAccion } from "@/components/BotonAccion";
import { fmtDiaSemana, hoyArgentina, rangoMesUTC } from "@/lib/fechas";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type GuardiaConParticipantes = Prisma.GuardiaGetPayload<{
  include: { participantes: { include: { usuario: true } }; intercambios: true };
}>;

type UsuarioMin = { id: string; nombre: string; apellido: string };

function mesStr(anio: number, mes1a12: number): string {
  return `${anio}-${String(mes1a12).padStart(2, "0")}`;
}

export default async function GuardiasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");

  const { mes } = await searchParams;
  const hoy = hoyArgentina();
  let anio = hoy.y;
  let mes1a12 = hoy.m;
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [a, m] = mes.split("-").map(Number);
    anio = a;
    mes1a12 = m;
  }

  const { inicio, fin } = rangoMesUTC(anio, mes1a12);

  const guardias = await prisma.guardia.findMany({
    where: {
      destacamentoId: ctx.destacamentoId,
      fecha: { gte: inicio, lt: fin },
    },
    include: {
      participantes: { include: { usuario: true } },
      intercambios: { orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ fecha: "asc" }, { tipo: "asc" }],
  });

  const usuarios = await prisma.usuario.findMany({
    where: { destacamentoId: ctx.destacamentoId, activo: true },
    orderBy: [{ apellido: "asc" }],
    select: { id: true, nombre: true, apellido: true },
  });

  const puedeGestionar = puedeGestionarGuardias(ctx);
  const misGuardias = guardias.filter((g) =>
    g.participantes.some((p) => p.usuarioId === ctx.usuarioId),
  );

  // Agrupar por día del mes.
  const porDia = new Map<number, GuardiaConParticipantes[]>();
  for (const g of guardias) {
    const dia = g.fecha.getUTCDate();
    porDia.set(dia, [...(porDia.get(dia) ?? []), g]);
  }
  const dias = [...porDia.keys()].sort((a, b) => a - b);

  const mesAnterior =
    mes1a12 === 1 ? mesStr(anio - 1, 12) : mesStr(anio, mes1a12 - 1);
  const mesSiguiente =
    mes1a12 === 12 ? mesStr(anio + 1, 1) : mesStr(anio, mes1a12 + 1);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-500">
            ← Inicio
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Guardias
          </h1>
        </div>
        {puedeGestionar && (
          <Link
            href="/guardias/nueva"
            className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white"
          >
            + Nueva
          </Link>
        )}
      </header>

      {/* Navegación de meses */}
      <nav className="flex items-center justify-between rounded-xl bg-white p-2 shadow-sm dark:bg-zinc-900">
        <Link
          href={`/guardias?mes=${mesAnterior}`}
          className="rounded-lg px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ← Anterior
        </Link>
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {MESES[mes1a12 - 1]} {anio}
        </span>
        <Link
          href={`/guardias?mes=${mesSiguiente}`}
          className="rounded-lg px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Siguiente →
        </Link>
      </nav>

      {/* Mis guardias del mes */}
      {misGuardias.length > 0 && (
        <section className="rounded-2xl bg-amber-50 p-4 shadow-sm dark:bg-amber-950/30">
          <h2 className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            Mis guardias este mes
          </h2>
          <ul className="flex flex-col gap-1 text-sm text-zinc-800 dark:text-zinc-200">
            {misGuardias.map((g) => (
              <li key={g.id}>
                {g.fecha.getUTCDate()} de {MESES[mes1a12 - 1]} ·{" "}
                {NOMBRE_TIPO_GUARDIA[g.tipo]} ({horarioGuardia(g.tipo)})
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Calendario del mes (por día) */}
      {dias.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">
          No hay guardias cargadas este mes.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {dias.map((dia) => {
            const fecha = new Date(Date.UTC(anio, mes1a12 - 1, dia));
            const diaSemana = fmtDiaSemana(fecha);
            return (
              <section key={dia} className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-zinc-500">
                  {diaSemana} {dia}
                </h3>
                {porDia.get(dia)!.map((g) => (
                  <TarjetaGuardia
                    key={g.id}
                    guardia={g}
                    puedeGestionar={puedeGestionar}
                    usuarioId={ctx.usuarioId}
                    usuarios={usuarios}
                  />
                ))}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

function TarjetaGuardia({
  guardia,
  puedeGestionar,
  usuarioId,
  usuarios,
}: {
  guardia: GuardiaConParticipantes;
  puedeGestionar: boolean;
  usuarioId: string;
  usuarios: UsuarioMin[];
}) {
  const quienes =
    guardia.tipo === "CUARTELERO"
      ? (guardia.cuarteleroNombre ?? "—")
      : guardia.participantes.length > 0
        ? guardia.participantes
            .map((p) => `${p.usuario.apellido}, ${p.usuario.nombre}`)
            .join(" · ")
        : "sin asignar";

  // El usuario puede ceder solo si es participante de una guardia interna.
  const participa =
    guardia.tipo === "INTERNA" &&
    guardia.participantes.some((p) => p.usuarioId === usuarioId);

  return (
    <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {NOMBRE_TIPO_GUARDIA[guardia.tipo]}
          </span>
          <span className="ml-2 text-xs text-zinc-500">
            {horarioGuardia(guardia.tipo)}
          </span>
        </div>
        {puedeGestionar && (
          <div className="flex items-center gap-3">
            <Link
              href={`/guardias/${guardia.id}/editar`}
              className="text-xs font-medium text-zinc-600 underline dark:text-zinc-300"
            >
              Editar
            </Link>
            <form action={eliminarGuardia}>
              <input type="hidden" name="guardiaId" value={guardia.id} />
              <BotonAccion
                confirmar="¿Eliminar esta guardia?"
                pendiente="Eliminando…"
                className="text-xs font-medium text-red-700 underline"
              >
                Eliminar
              </BotonAccion>
            </form>
          </div>
        )}
      </div>
      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{quienes}</p>
      {guardia.notas && (
        <p className="mt-1 text-xs text-zinc-500">{guardia.notas}</p>
      )}

      {guardia.intercambios.length > 0 && (
        <ul className="mt-1 text-xs text-zinc-400">
          {guardia.intercambios.map((i) => (
            <li key={i.id}>
              Intercambio: {i.deNombre} → {i.aNombre}
            </li>
          ))}
        </ul>
      )}

      {participa && (
        <CederGuardia
          guardiaId={guardia.id}
          opciones={usuarios.filter((u) => u.id !== usuarioId)}
        />
      )}
    </div>
  );
}
