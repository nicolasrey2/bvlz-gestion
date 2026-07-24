import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { nombreRango } from "@/lib/dominio";

/// Organigrama del destacamento: conducción + áreas con encargado y miembros.
/// Visible para todo el personal autenticado.
export default async function DestacamentoPage() {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");

  const dto = await prisma.destacamento.findUnique({
    where: { id: ctx.destacamentoId },
    include: {
      usuarios: {
        include: { asignaciones: { where: { vigenteHasta: null } } },
      },
      areas: {
        orderBy: { nombre: "asc" },
        include: {
          asignaciones: {
            where: { vigenteHasta: null },
            include: { usuario: true },
          },
        },
      },
    },
  });
  if (!dto) redirect("/");

  // Nombre legible de un usuario con su rango.
  const conRango = (u: { nombre: string; apellido: string; rango: Parameters<typeof nombreRango>[0] }) =>
    `${nombreRango(u.rango)} ${u.apellido}, ${u.nombre}`;

  const conduccion = (rol: string) =>
    dto.usuarios.filter((u) => u.asignaciones.some((a) => a.rol === rol));

  const encargados = conduccion("ENCARGADO_INTERNO");
  const subEncargados = conduccion("SUB_ENCARGADO");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 p-6">
      <header>
        <Link href="/" className="text-sm text-zinc-500">
          ← Inicio
        </Link>
        <h1 className="text-xl font-bold text-red-700 dark:text-red-500">
          {dto.nombre}
        </h1>
      </header>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-semibold text-zinc-500">Conducción</h2>
        <Fila titulo="Encargado Interno" personas={encargados.map(conRango)} />
        <Fila titulo="Sub-encargado" personas={subEncargados.map(conRango)} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-500">Áreas</h2>
        {dto.areas.map((area) => {
          const encargado = area.asignaciones.filter(
            (a) => a.rol === "ENCARGADO_AREA",
          );
          const miembros = area.asignaciones.filter((a) => a.rol === "MIEMBRO");
          return (
            <div
              key={area.id}
              className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900"
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {area.nombre}
              </h3>
              <Fila
                titulo="Encargado"
                personas={encargado.map((a) => conRango(a.usuario))}
              />
              <Fila
                titulo="Miembros"
                personas={miembros.map((a) => conRango(a.usuario))}
              />
            </div>
          );
        })}
      </section>
    </main>
  );
}

function Fila({ titulo, personas }: { titulo: string; personas: string[] }) {
  return (
    <div className="mt-1 text-sm">
      <span className="text-zinc-400">{titulo}: </span>
      {personas.length === 0 ? (
        <span className="text-zinc-400 italic">sin asignar</span>
      ) : (
        <span className="text-zinc-800 dark:text-zinc-200">
          {personas.join(" · ")}
        </span>
      )}
    </div>
  );
}
