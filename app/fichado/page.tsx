import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeVerFichados } from "@/lib/permisos";
import { NOMBRE_TIPO_FICHADA } from "@/lib/dominio";
import { fichar } from "@/server/fichado";

function hora(d: Date) {
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export default async function FichadoPage() {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");

  const ahora = new Date();
  const inicioDia = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
  );
  const finDia = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate() + 1,
  );

  // ¿Le toca guardia interna hoy?
  const guardiaHoy = await prisma.guardia.findFirst({
    where: {
      destacamentoId: ctx.destacamentoId,
      tipo: "INTERNA",
      fecha: { gte: inicioDia, lt: finDia },
      participantes: { some: { usuarioId: ctx.usuarioId } },
    },
  });

  const misFichadasHoy = await prisma.fichada.findMany({
    where: {
      usuarioId: ctx.usuarioId,
      momento: { gte: inicioDia, lt: finDia },
    },
    orderBy: { momento: "asc" },
  });

  // Registro del día para oficina/encargado.
  const verRegistro = puedeVerFichados(ctx);
  const registroHoy = verRegistro
    ? await prisma.fichada.findMany({
        where: {
          destacamentoId: ctx.destacamentoId,
          momento: { gte: inicioDia, lt: finDia },
        },
        include: { usuario: true },
        orderBy: { momento: "desc" },
      })
    : [];

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

      {/* Botones de fichado */}
      <div className="grid grid-cols-2 gap-3">
        <form action={fichar}>
          <input type="hidden" name="tipo" value="ENTRADA" />
          <button className="w-full rounded-2xl bg-green-700 px-4 py-6 text-lg font-semibold text-white">
            Fichar entrada
          </button>
        </form>
        <form action={fichar}>
          <input type="hidden" name="tipo" value="SALIDA" />
          <button className="w-full rounded-2xl bg-zinc-700 px-4 py-6 text-lg font-semibold text-white">
            Fichar salida
          </button>
        </form>
      </div>

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
                </span>
                <span className="text-zinc-500">{hora(f.momento)}</span>
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
                  </span>
                  <span className="text-zinc-500">{hora(f.momento)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
