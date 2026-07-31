import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeEditarParte } from "@/lib/permisos";
import { fmtFechaInput } from "@/lib/fechas";
import { editarParte } from "@/server/partes";
import { sugerenciasDePersonal } from "@/server/partePersonalSugerencias";
import { leerDetalle } from "@/lib/partesDetalle";
import { leerPersonal } from "@/lib/partePersonal";
import { FormParte, type ValoresParte } from "@/components/FormParte";

/// Edición de un parte abierto (PRD §4.7: el parte se completa en varias
/// pasadas; las horas de dominado/extinguido/finalización se conocen bastante
/// después del aviso).
///
/// El permiso se valida **acá y en la Server Action**: esta comprobación es
/// para no mostrar un formulario que después va a rebotar; la que manda es la
/// del servidor (`editarParte`).
export default async function EditarPartePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  const { id } = await params;

  const parte = await prisma.parteIntervencion.findFirst({
    where: { id, destacamentoId: ctx.destacamentoId },
  });
  if (!parte) redirect("/partes");
  // Un parte cerrado no se edita: se vuelve a la ficha.
  if (!puedeEditarParte(ctx, parte)) redirect(`/partes/${parte.id}`);

  const sugerenciasPersonal = await sugerenciasDePersonal(ctx.destacamentoId);

  // Los dos campos Json se parsean con sus helpers tolerantes, así un parte
  // cargado antes de P6/P9 se abre igual en el formulario nuevo.
  const inicial: ValoresParte = {
    id: parte.id,
    tipoSiniestro: parte.tipoSiniestro,
    servicioNro: parte.servicioNro,
    rubaNro: parte.rubaNro,
    certificadoNro: parte.certificadoNro,
    informeNro: parte.informeNro,
    cuartel: parte.cuartel,
    fecha: parte.fecha ? fmtFechaInput(parte.fecha) : null,
    objeto: parte.objeto,
    direccion: parte.direccion,
    localidad: parte.localidad,
    jurisdiccionPolicial: parte.jurisdiccionPolicial,
    pedidoEfectuado: parte.pedidoEfectuado,
    ubicacion: parte.ubicacion,
    panorama: parte.panorama,
    horaAviso: parte.horaAviso,
    horaLlegada: parte.horaLlegada,
    horaCircunscripto: parte.horaCircunscripto,
    horaDominado: parte.horaDominado,
    horaExtinguido: parte.horaExtinguido,
    horaFinalizacion: parte.horaFinalizacion,
    horaRegreso: parte.horaRegreso,
    dotaciones: parte.dotaciones,
    bomberos: parte.bomberos,
    unidades: parte.unidades,
    descripcion: parte.descripcion,
    datosTomadosPor: parte.datosTomadosPor,
    oficialActuante: parte.oficialActuante,
    dptoTecnico: parte.dptoTecnico,
    jefeCuerpo: parte.jefeCuerpo,
    detalle: leerDetalle(parte.detalle),
    personal: leerPersonal(parte.personal),
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-4 p-6">
      <header>
        <Link href={`/partes/${parte.id}`} className="text-sm text-zinc-500">
          ← Parte
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Editar parte
          {parte.servicioNro ? ` N° ${parte.servicioNro}` : ""}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Se puede editar mientras el parte esté abierto. Al cerrarlo queda
          fijo.
        </p>
      </header>
      <FormParte
        accion={editarParte}
        sugerenciasPersonal={sugerenciasPersonal}
        inicial={inicial}
      />
    </main>
  );
}
