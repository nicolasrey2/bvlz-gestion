import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { esConduccion } from "@/lib/permisos";
import {
  NOMBRE_TIPO_SINIESTRO,
  NOMBRE_ESTADO,
  COLOR_ESTADO,
} from "@/lib/dominio";
import {
  hoyArgentina,
  rangoMesAR,
  rangoMesUTC,
  rangoDiaAR,
  rangoDiaUTC,
} from "@/lib/fechas";
import {
  calcularMinutos,
  formatearHoras,
  META_HORAS_MES,
  type FichadaMin,
} from "@/lib/servicio";
import { esTareaVencida } from "@/lib/tareas";
import { StatTile } from "@/components/reportes/StatTile";
import { Seccion } from "@/components/reportes/Seccion";
import { ListaBarras, type ItemBarra } from "@/components/reportes/ListaBarras";
import type { EstadoTarea, TipoSiniestro } from "@/generated/prisma/client";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/// Orden fijo para mostrar los chips de estado de tareas (flujo natural).
const ORDEN_ESTADOS: EstadoTarea[] = ["PENDIENTE", "EN_REVISION", "COMPLETA"];

function mesStr(anio: number, mes1a12: number): string {
  return `${anio}-${String(mes1a12).padStart(2, "0")}`;
}

/// Parsea una hora "HH:MM" a minutos desde medianoche. null si falta o no
/// tiene el formato esperado (los partes viejos pueden traer texto libre).
function parseHoraAMinutos(hhmm: string | null): number | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const horas = Number(m[1]);
  const minutos = Number(m[2]);
  if (horas > 23 || minutos > 59) return null;
  return horas * 60 + minutos;
}

/// Minutos entre aviso y llegada. Si la llegada "cruza" la medianoche (queda
/// antes que el aviso en el reloj), se asume que fue al día siguiente.
function minutosAvisoLlegada(horaAviso: string | null, horaLlegada: string | null): number | null {
  const aviso = parseHoraAMinutos(horaAviso);
  const llegada = parseHoraAMinutos(horaLlegada);
  if (aviso === null || llegada === null) return null;
  const diff = llegada - aviso;
  return diff >= 0 ? diff : diff + 24 * 60;
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  if (!esConduccion(ctx)) redirect("/");

  const { mes } = await searchParams;
  const hoy = hoyArgentina();
  let anio = hoy.y;
  let mes1a12 = hoy.m;
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [a, m] = mes.split("-").map(Number);
    anio = a;
    mes1a12 = m;
  }

  // Dos rangos del mismo mes: uno para timestamps (fichadas, partes.createdAt)
  // en hora Argentina, y otro en UTC para las fechas "día" (guardia.fecha).
  const { inicio: inicioMesAR, fin: finMesAR } = rangoMesAR(anio, mes1a12);
  const { inicio: inicioMesUTC, fin: finMesUTC } = rangoMesUTC(anio, mes1a12);

  // "Hoy" real (no el mes navegado) para el KPI de presentismo diario y para
  // decidir qué tareas están vencidas.
  const { inicio: inicioHoyAR, fin: finHoyAR } = rangoDiaAR(hoy.y, hoy.m, hoy.d);
  const { inicio: inicioHoyUTC } = rangoDiaUTC(hoy.y, hoy.m, hoy.d);

  const destacamentoId = ctx.destacamentoId;

  const [usuariosActivos, partesMes, tareasTodas, guardiasMes, fichadasMes, fichadasHoy] =
    await Promise.all([
      prisma.usuario.findMany({
        where: { destacamentoId, activo: true },
        orderBy: [{ apellido: "asc" }],
        select: { id: true, nombre: true, apellido: true },
      }),
      prisma.parteIntervencion.findMany({
        where: { destacamentoId, createdAt: { gte: inicioMesAR, lt: finMesAR } },
        select: { id: true, tipoSiniestro: true, horaAviso: true, horaLlegada: true },
      }),
      prisma.tarea.findMany({
        where: { destacamentoId },
        select: {
          id: true,
          estado: true,
          fechaLimite: true,
          areaId: true,
          area: { select: { nombre: true } },
        },
      }),
      prisma.guardia.findMany({
        where: { destacamentoId, fecha: { gte: inicioMesUTC, lt: finMesUTC } },
        select: {
          id: true,
          tipo: true,
          participantes: {
            select: { usuarioId: true, usuario: { select: { nombre: true, apellido: true } } },
          },
        },
      }),
      prisma.fichada.findMany({
        where: { destacamentoId, momento: { gte: inicioMesAR, lt: finMesAR } },
        select: { usuarioId: true, tipo: true, momento: true },
      }),
      prisma.fichada.findMany({
        where: { destacamentoId, momento: { gte: inicioHoyAR, lt: finHoyAR } },
        select: { usuarioId: true },
        distinct: ["usuarioId"],
      }),
    ]);

  // --- KPIs -------------------------------------------------------------
  const intervencionesDelMes = partesMes.length;
  const tareasPendientes = tareasTodas.filter((t) => t.estado === "PENDIENTE").length;
  const guardiasDelMes = guardiasMes.length;
  const personasEnServicioHoy = new Set(fichadasHoy.map((f) => f.usuarioId)).size;

  // --- Horas por persona (mes) -------------------------------------------
  // Se agrupan las fichadas del mes en memoria (una sola consulta ya traída)
  // en vez de una query por usuario.
  const fichadasPorUsuario = new Map<string, FichadaMin[]>();
  for (const f of fichadasMes) {
    const lista = fichadasPorUsuario.get(f.usuarioId) ?? [];
    lista.push({ tipo: f.tipo, momento: f.momento });
    fichadasPorUsuario.set(f.usuarioId, lista);
  }
  const ahora = new Date();
  const horasPorPersona = usuariosActivos
    .map((u) => {
      const minutos = calcularMinutos(fichadasPorUsuario.get(u.id) ?? [], ahora);
      return { usuario: u, minutos };
    })
    .sort((a, b) => b.minutos - a.minutos);

  const barrasHoras: ItemBarra[] = horasPorPersona.map(({ usuario, minutos }) => ({
    key: usuario.id,
    label: `${usuario.apellido}, ${usuario.nombre}`,
    valor: minutos / 60,
    max: META_HORAS_MES,
    texto: formatearHoras(minutos),
    color: minutos / 60 >= META_HORAS_MES ? "bg-green-600" : "bg-red-600",
  }));

  // --- Intervenciones por tipo + promedio aviso→llegada -------------------
  const conteoPorTipo = new Map<TipoSiniestro, number>();
  for (const p of partesMes) {
    conteoPorTipo.set(p.tipoSiniestro, (conteoPorTipo.get(p.tipoSiniestro) ?? 0) + 1);
  }
  const barrasTipo: ItemBarra[] = [...conteoPorTipo.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tipo, cantidad]) => ({
      key: tipo,
      label: NOMBRE_TIPO_SINIESTRO[tipo],
      valor: cantidad,
      max: intervencionesDelMes,
      texto: `${cantidad}`,
    }));

  const diferenciasAvisoLlegada = partesMes
    .map((p) => minutosAvisoLlegada(p.horaAviso, p.horaLlegada))
    .filter((m): m is number => m !== null);
  const promedioAvisoLlegada =
    diferenciasAvisoLlegada.length > 0
      ? Math.round(
          diferenciasAvisoLlegada.reduce((suma, m) => suma + m, 0) /
            diferenciasAvisoLlegada.length,
        )
      : null;

  // --- Tareas: por estado, vencidas y por área -----------------------------
  const conteoPorEstado = new Map<EstadoTarea, number>();
  for (const t of tareasTodas) {
    conteoPorEstado.set(t.estado, (conteoPorEstado.get(t.estado) ?? 0) + 1);
  }
  const tareasVencidas = tareasTodas.filter((t) => esTareaVencida(t, inicioHoyUTC)).length;

  const porArea = new Map<string, { nombre: string; cantidad: number }>();
  for (const t of tareasTodas) {
    const key = t.areaId ?? "general";
    const nombre = t.area?.nombre ?? "General";
    const actual = porArea.get(key);
    porArea.set(key, { nombre, cantidad: (actual?.cantidad ?? 0) + 1 });
  }
  const totalTareas = tareasTodas.length;
  const barrasArea: ItemBarra[] = [...porArea.entries()]
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .map(([key, { nombre, cantidad }]) => ({
      key,
      label: nombre,
      valor: cantidad,
      max: totalTareas,
      texto: `${cantidad}`,
    }));

  // --- Guardias internas por persona (mes) + presentismo -------------------
  const conteoGuardiasPorUsuario = new Map<
    string,
    { nombre: string; apellido: string; cantidad: number }
  >();
  for (const g of guardiasMes) {
    if (g.tipo !== "INTERNA") continue;
    for (const p of g.participantes) {
      const actual = conteoGuardiasPorUsuario.get(p.usuarioId);
      conteoGuardiasPorUsuario.set(p.usuarioId, {
        nombre: p.usuario.nombre,
        apellido: p.usuario.apellido,
        cantidad: (actual?.cantidad ?? 0) + 1,
      });
    }
  }
  const maxGuardiasPersona = Math.max(
    1,
    ...[...conteoGuardiasPorUsuario.values()].map((v) => v.cantidad),
  );
  const barrasGuardias: ItemBarra[] = [...conteoGuardiasPorUsuario.entries()]
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .map(([usuarioId, { nombre, apellido, cantidad }]) => ({
      key: usuarioId,
      label: `${apellido}, ${nombre}`,
      valor: cantidad,
      max: maxGuardiasPersona,
      texto: `${cantidad}`,
    }));

  const activosIds = new Set(usuariosActivos.map((u) => u.id));
  const ficharonEsteMes = [...fichadasPorUsuario.keys()].filter((id) => activosIds.has(id));
  const presentismoPct =
    usuariosActivos.length > 0
      ? Math.round((ficharonEsteMes.length / usuariosActivos.length) * 100)
      : 0;

  const mesAnterior = mes1a12 === 1 ? mesStr(anio - 1, 12) : mesStr(anio, mes1a12 - 1);
  const mesSiguiente = mes1a12 === 12 ? mesStr(anio + 1, 1) : mesStr(anio, mes1a12 + 1);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 p-6">
      <header>
        <Link href="/" className="text-sm text-zinc-500">
          ← Inicio
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Reportes</h1>
      </header>

      {/* Navegación de meses */}
      <nav className="flex items-center justify-between rounded-xl bg-white p-2 shadow-sm dark:bg-zinc-900">
        <Link
          href={`/reportes?mes=${mesAnterior}`}
          className="rounded-lg px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ← Anterior
        </Link>
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {MESES[mes1a12 - 1]} {anio}
        </span>
        <Link
          href={`/reportes?mes=${mesSiguiente}`}
          className="rounded-lg px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Siguiente →
        </Link>
      </nav>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Intervenciones (mes)" valor={intervencionesDelMes} />
        <StatTile label="Tareas pendientes" valor={tareasPendientes} />
        <StatTile label="Guardias (mes)" valor={guardiasDelMes} />
        <StatTile label="En servicio hoy" valor={personasEnServicioHoy} />
      </div>

      {/* Horas por persona */}
      <Seccion titulo={`Horas por persona (meta ${META_HORAS_MES}h)`}>
        <ListaBarras items={barrasHoras} vacio="No hay fichadas este mes." />
      </Seccion>

      {/* Intervenciones por tipo */}
      <Seccion titulo="Intervenciones por tipo">
        <ListaBarras items={barrasTipo} vacio="No hay partes este mes." />
        <StatTile
          label="Promedio aviso → llegada"
          valor={promedioAvisoLlegada !== null ? formatearHoras(promedioAvisoLlegada) : "—"}
          sub={
            promedioAvisoLlegada !== null
              ? undefined
              : "Sin partes con ambos horarios cargados."
          }
        />
      </Seccion>

      {/* Tareas */}
      <Seccion titulo="Tareas por estado">
        <div className="flex flex-wrap gap-2">
          {ORDEN_ESTADOS.map((estado) => (
            <span
              key={estado}
              className={`rounded px-2 py-0.5 text-xs ${COLOR_ESTADO[estado]}`}
            >
              {NOMBRE_ESTADO[estado]}: {conteoPorEstado.get(estado) ?? 0}
            </span>
          ))}
          {tareasVencidas > 0 && (
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-300">
              Vencidas: {tareasVencidas}
            </span>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Tareas por área">
        <ListaBarras items={barrasArea} vacio="No hay tareas cargadas." />
      </Seccion>

      {/* Guardias y presentismo */}
      <Seccion titulo="Guardias internas por persona (mes)">
        <ListaBarras items={barrasGuardias} vacio="No hay guardias internas este mes." />
      </Seccion>

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Presentismo (mes)"
          valor={`${presentismoPct}%`}
          sub={`${ficharonEsteMes.length}/${usuariosActivos.length} activos ficharon`}
        />
        <StatTile label="Personal activo" valor={usuariosActivos.length} />
      </div>
    </main>
  );
}
