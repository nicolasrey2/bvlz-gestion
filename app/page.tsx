import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getAuthUser, getUsuarioActual, getContextoAuth } from "@/lib/auth";
import { puedeGestionarUsuarios } from "@/lib/permisos";
import { NOMBRE_ROL } from "@/lib/dominio";
import { logout } from "./login/actions";
import { ToggleTema } from "@/components/ToggleTema";
import logoCuartel from "@/public/logo-cuartel.png";

export default async function Home() {
  // El proxy ya redirige a no autenticados, pero reforzamos en el servidor.
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");

  const usuario = await getUsuarioActual();

  // Autenticado en Supabase pero sin Usuario vinculado: no puede operar.
  if (!usuario) {
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

  const ctx = await getContextoAuth();
  const esConduccion = ctx ? puedeGestionarUsuarios(ctx) : false;

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
        <div className="flex items-center gap-2">
          <ToggleTema />
          <form action={logout}>
            <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
              Salir
            </button>
          </form>
        </div>
      </header>

      <div>
        <h1 className="text-xl font-bold text-red-700 dark:text-red-500">
          {usuario.destacamento.nombre}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {usuario.nombre} {usuario.apellido}
        </p>
      </div>

      <nav className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tarjeta href="/tareas" titulo="Tareas" desc="Crear y seguir" />
        <Tarjeta
          href="/destacamento"
          titulo="Destacamento"
          desc="Organigrama y áreas"
        />
        {esConduccion && (
          <Tarjeta href="/personal" titulo="Personal" desc="Altas y roles" />
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
        Fase 2 · próximamente: guardias, fichado y partes.
      </p>
    </main>
  );
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
