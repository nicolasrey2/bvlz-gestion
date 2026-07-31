import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  getAuthUser,
  getUsuarioVinculado,
  contextoDesdeUsuario,
} from "@/lib/auth";
import { puedeGestionarUsuarios } from "@/lib/permisos";
import { NOMBRE_ROL, NOMBRE_TIPO_GUARDIA, horarioGuardia } from "@/lib/dominio";
import { diasHasta, fmtDiaNumeroMes } from "@/lib/fechas";
import {
  proximaGuardiaDe,
  type ProximaGuardia as ProximaGuardiaDatos,
} from "@/server/guardiasConsultas";
import { logout } from "./login/actions";
import logoCuartel from "@/public/logo-cuartel.png";

export default async function Home() {
  // Camino feliz: una sola consulta. El proxy ya redirige a los no
  // autenticados; solo si no hay usuario vinculado chequeamos la sesión.
  // Se usa getUsuarioVinculado (no getUsuarioActual) porque acá hay que
  // distinguir "no vinculado" de "dado de baja" para dar el mensaje correcto.
  const usuario = await getUsuarioVinculado();

  if (!usuario) {
    const authUser = await getAuthUser();
    if (!authUser) redirect("/login");
    // Autenticado en Supabase pero sin Usuario vinculado: no puede operar.
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-sm text-zinc-600 dark:text-zinc-400">
          Tu cuenta todavía no está vinculada a un usuario del destacamento.
          Contactá al encargado.
        </p>
        <form action={logout}>
          <button className="text-sm font-medium text-red-700 underline">
            Cerrar sesión
          </button>
        </form>
      </main>
    );
  }

  // S1 — baja lógica: la cuenta existe pero está desactivada. No se le arma
  // contexto de permisos, así que tampoco puede operar por otras rutas.
  if (!usuario.activo) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-sm text-zinc-600 dark:text-zinc-400">
          Tu cuenta está desactivada. Si creés que es un error, contactá al
          encargado del destacamento.
        </p>
        <form action={logout}>
          <button className="text-sm font-medium text-red-700 underline">
            Cerrar sesión
          </button>
        </form>
      </main>
    );
  }

  const ctx = contextoDesdeUsuario(usuario);
  const esConduccion = puedeGestionarUsuarios(ctx);

  // Recordatorio visual de la próxima guardia: es el dato que más se viene a
  // buscar a la app, y hasta ahora había que entrar al calendario del mes.
  const proximaGuardia = await proximaGuardiaDe(usuario.id, usuario.destacamentoId);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div className="rounded-xl bg-white p-2 shadow-sm">
          <Image
            src={logoCuartel}
            alt="Bomberos Voluntarios de Lomas de Zamora"
            priority
            className="h-auto w-32 sm:w-40"
          />
        </div>
        <form action={logout}>
          <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
            Salir
          </button>
        </form>
      </header>

      <div>
        <h1 className="text-xl font-bold text-red-700 dark:text-red-500">
          {usuario.destacamento.nombre}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {usuario.nombre} {usuario.apellido}
        </p>
      </div>

      <ProximaGuardia guardia={proximaGuardia} />

      <nav className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tarjeta href="/tareas" titulo="Tareas" desc="Crear y seguir" />
        <Tarjeta href="/guardias" titulo="Guardias" desc="Calendario mensual" />
        <Tarjeta href="/fichado" titulo="Fichado" desc="Entrada y salida" />
        <Tarjeta href="/novedades" titulo="Novedades" desc="Cuaderno del dto" />
        <Tarjeta href="/partes" titulo="Partes" desc="Intervenciones" />
        <Tarjeta
          href="/destacamento"
          titulo="Destacamento"
          desc="Organigrama y áreas"
        />
        {esConduccion && (
          <Tarjeta href="/personal" titulo="Personal" desc="Altas y roles" />
        )}
        {esConduccion && (
          <Tarjeta href="/reportes" titulo="Reportes" desc="Estadísticas" />
        )}
      </nav>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Tus roles
        </h2>
        {usuario.asignaciones.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin roles asignados.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {usuario.asignaciones.map((a) => (
              <li key={a.id} className="text-sm text-zinc-800 dark:text-zinc-200">
                {NOMBRE_ROL[a.rol] ?? a.rol}
                {a.area ? ` · ${a.area.nombre}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-zinc-400">
        Bomberos Voluntarios de Lomas de Zamora
      </p>
    </main>
  );
}

/// Tarjeta "Tu próxima guardia": la fecha grande (día, número y mes) para
/// reconocerla de un vistazo, con el horario del tipo de guardia y cuánto falta.
/// Toda la tarjeta linkea al calendario del mes.
function ProximaGuardia({ guardia }: { guardia: ProximaGuardiaDatos | null }) {
  if (!guardia) {
    return (
      <Link
        href="/guardias"
        className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900"
      >
        <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Tu próxima guardia
        </span>
        <span className="mt-1 block text-sm text-zinc-500">
          No tenés guardias programadas. Ver el calendario →
        </span>
      </Link>
    );
  }

  const dias = diasHasta(guardia.fecha);

  return (
    <Link
      href="/guardias"
      className="rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Tu próxima guardia
        </span>
        <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-200">
          {cuandoEs(dias)}
        </span>
      </div>

      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {fmtDiaNumeroMes(guardia.fecha)}
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {NOMBRE_TIPO_GUARDIA[guardia.tipo]} · {horarioGuardia(guardia.tipo)}
      </p>
    </Link>
  );
}

/// Etiqueta de cuánto falta. Los días negativos son la guardia de anoche que
/// sigue en curso (arranca 22:00 y termina 08:00 — ver `proximaGuardiaDe`).
function cuandoEs(dias: number): string {
  if (dias < 0) return "En curso";
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  return `En ${dias} días`;
}

function Tarjeta({
  href,
  titulo,
  desc,
}: {
  href: string;
  titulo: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      <span className="block font-semibold text-zinc-900 dark:text-zinc-100">
        {titulo}
      </span>
      <span className="text-xs text-zinc-500">{desc}</span>
    </Link>
  );
}
