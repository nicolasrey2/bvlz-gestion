import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { esConduccion } from "@/lib/permisos";
import { nombreRango } from "@/lib/dominio";
import { Organigrama, type NodoArea } from "@/components/Organigrama";
import { FormUbicacionCuartel } from "@/components/FormUbicacionCuartel";

/// Organigrama del destacamento: conducción + áreas con encargado y miembros,
/// dibujado como diagrama. Visible para todo el personal autenticado.
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

  type Persona = { nombre: string; apellido: string; rango: Parameters<typeof nombreRango>[0] };
  const conRango = (u: Persona) =>
    `${nombreRango(u.rango)} ${u.apellido}, ${u.nombre}`;
  const sinRango = (u: Persona) => `${u.apellido}, ${u.nombre}`;

  const porRol = (rol: string) =>
    dto.usuarios.filter((u) => u.asignaciones.some((a) => a.rol === rol));

  const encargado = porRol("ENCARGADO_INTERNO").map(conRango).join(" · ") || null;
  const subEncargado = porRol("SUB_ENCARGADO").map(conRango).join(" · ") || null;

  const areas: NodoArea[] = dto.areas.map((area) => ({
    nombre: area.nombre,
    encargado:
      area.asignaciones
        .filter((a) => a.rol === "ENCARGADO_AREA")
        .map((a) => conRango(a.usuario))
        .join(" · ") || null,
    miembros: area.asignaciones
      .filter((a) => a.rol === "MIEMBRO")
      .map((a) => sinRango(a.usuario)),
  }));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 p-6">
      <header>
        <Link href="/" className="text-sm text-zinc-500">
          ← Inicio
        </Link>
        <h1 className="text-xl font-bold text-red-700 dark:text-red-500">
          {dto.nombre}
        </h1>
        <p className="text-sm text-zinc-500">Organigrama</p>
      </header>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <Organigrama
          encargado={encargado}
          subEncargado={subEncargado}
          areas={areas}
        />
      </section>

      <p className="text-center text-xs text-zinc-400">
        Deslizá horizontalmente para ver todas las áreas.
      </p>

      {/* Config de geo-fichado: solo conducción la ve y la edita. */}
      {esConduccion(ctx) && (
        <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold text-zinc-500">
            Ubicación del cuartel (para fichado)
          </h2>
          <p className="mb-3 text-xs text-zinc-400">
            Se usa para el geo-fichado: nunca bloquea a nadie, solo marca si la
            fichada quedó dentro del radio configurado.
          </p>
          <FormUbicacionCuartel
            latitud={dto.latitud}
            longitud={dto.longitud}
            radio={dto.radioFichadoM}
          />
        </section>
      )}
    </main>
  );
}
