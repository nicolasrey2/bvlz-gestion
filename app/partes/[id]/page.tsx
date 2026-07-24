import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { esConduccion } from "@/lib/permisos";
import { NOMBRE_TIPO_SINIESTRO, NOMBRE_ESTADO_PARTE } from "@/lib/dominio";
import { cerrarParte } from "@/server/partes";
import { fmtFechaDia, fmtFechaHora } from "@/lib/fechas";
import {
  leerDetalle,
  seccionesPresentes,
  NOMBRE_SECCION,
  type DetalleParte,
  type SeccionParte,
} from "@/lib/partesDetalle";

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

  // El detalle condicional (vehículos, incendio, víctimas, etc.) se guarda
  // como Json — se lee con el helper para no confiar en su forma en runtime.
  const detalle = leerDetalle(parte.detalle);
  const secciones = seccionesPresentes(detalle);

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

      {secciones.map((seccion) => (
        <section key={seccion} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold text-zinc-500">
            {NOMBRE_SECCION[seccion]}
          </h2>
          <ContenidoSeccion seccion={seccion} detalle={detalle} />
        </section>
      ))}

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

/// "Sí"/"No" para los booleanos del detalle (nicho hidrante, extintor);
/// `undefined` si no se cargó (no se muestra la fila).
function boolTexto(v: boolean | undefined): string | undefined {
  return v === undefined ? undefined : v ? "Sí" : "No";
}

/// Encabezado de un bloque repetido dentro de una sección (Vehículo 1,
/// Víctima 2, etc.), para no repetir el card por cada instancia del array.
function Subbloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="border-t border-zinc-100 pt-2 first:border-0 first:pt-0 dark:border-zinc-800">
      <p className="mb-1 text-xs font-semibold text-zinc-400 uppercase">{titulo}</p>
      <dl className="flex flex-col gap-1 text-sm">{children}</dl>
    </div>
  );
}

/// Contenido de una tarjeta de sección del detalle — un renderer por sección
/// (mapa de estrategias, ver componentes de mapa arriba) en vez de un switch
/// que crezca con cada tipo de siniestro nuevo.
const RENDER_SECCION: Record<SeccionParte, (detalle: DetalleParte) => ReactNode> = {
  climaticas: (d) => (
    <dl className="flex flex-col gap-2 text-sm">
      <Dato titulo="Condiciones climáticas" valor={d.condicionesClimaticas ?? ""} />
    </dl>
  ),

  vehiculos: (d) => (
    <div className="flex flex-col gap-2">
      {d.vehiculos?.map((v, i) => (
        <Subbloque key={i} titulo={`Vehículo ${i + 1}`}>
          {v.propietario && <Dato titulo="Propietario/a" valor={v.propietario} />}
          {v.conductor && <Dato titulo="Conductor/a" valor={v.conductor} />}
          {v.edad && <Dato titulo="Edad" valor={v.edad} />}
          {v.domicilio && <Dato titulo="Domicilio" valor={v.domicilio} />}
          {v.dominio && <Dato titulo="Dominio" valor={v.dominio} />}
          {(v.marca || v.modelo || v.anio) && (
            <Dato
              titulo="Vehículo"
              valor={[v.marca, v.modelo, v.anio].filter(Boolean).join(" · ")}
            />
          )}
          {(v.aseguradora || v.poliza) && (
            <Dato
              titulo="Seguro"
              valor={[v.aseguradora, v.poliza && `Póliza ${v.poliza}`].filter(Boolean).join(" · ")}
            />
          )}
        </Subbloque>
      ))}
    </div>
  ),

  incendio: (d) => (
    <dl className="flex flex-col gap-2 text-sm">
      {d.incendio?.origen && <Dato titulo="Origen" valor={d.incendio.origen} />}
      {d.incendio?.causa && <Dato titulo="Causa" valor={d.incendio.causa} />}
      {d.incendio?.propagacion && <Dato titulo="Propagación" valor={d.incendio.propagacion} />}
      {d.incendio?.evolucion && (
        <Dato titulo="Evolución de los deterioros" valor={d.incendio.evolucion} />
      )}
    </dl>
  ),

  inmueble: (d) => (
    <dl className="flex flex-col gap-2 text-sm">
      {d.inmueble?.paredes && <Dato titulo="Paredes de" valor={d.inmueble.paredes} />}
      {d.inmueble?.techos && <Dato titulo="Techos de" valor={d.inmueble.techos} />}
      {d.inmueble?.instElectrica && (
        <Dato titulo="Tipo inst. eléctrica" valor={d.inmueble.instElectrica} />
      )}
      {d.inmueble?.instGas && <Dato titulo="Tipo inst. gas" valor={d.inmueble.instGas} />}
      {d.inmueble?.ambientes && <Dato titulo="Cant. de ambientes" valor={d.inmueble.ambientes} />}
      {d.inmueble?.pisos && <Dato titulo="Cant. de pisos" valor={d.inmueble.pisos} />}
      {boolTexto(d.inmueble?.nichoHidrante) && (
        <Dato titulo="¿Había nicho hidrante?" valor={boolTexto(d.inmueble?.nichoHidrante)!} />
      )}
      {boolTexto(d.inmueble?.extintor) && (
        <Dato titulo="¿Había extintor?" valor={boolTexto(d.inmueble?.extintor)!} />
      )}
    </dl>
  ),

  datosComplementarios: (d) => (
    <dl className="flex flex-col gap-2 text-sm">
      {d.datosComplementarios?.propietario && (
        <Dato titulo="Propietario/a" valor={d.datosComplementarios.propietario} />
      )}
      {d.datosComplementarios?.dni && <Dato titulo="DNI" valor={d.datosComplementarios.dni} />}
      {d.datosComplementarios?.domicilio && (
        <Dato titulo="Domicilio" valor={d.datosComplementarios.domicilio} />
      )}
      {(d.datosComplementarios?.aseguradora || d.datosComplementarios?.poliza) && (
        <Dato
          titulo="Seguro"
          valor={[
            d.datosComplementarios.aseguradora,
            d.datosComplementarios.poliza && `Póliza ${d.datosComplementarios.poliza}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
      )}
      {(d.datosComplementarios?.razonSocial || d.datosComplementarios?.ramo) && (
        <Dato
          titulo="Razón social"
          valor={[d.datosComplementarios.razonSocial, d.datosComplementarios.ramo]
            .filter(Boolean)
            .join(" · ")}
        />
      )}
    </dl>
  ),

  victimas: (d) => (
    <div className="flex flex-col gap-2">
      {d.victimas?.map((v, i) => (
        <Subbloque key={i} titulo={`Víctima ${i + 1}`}>
          {v.nombre && <Dato titulo="Nombre y apellido" valor={v.nombre} />}
          {v.dni && <Dato titulo="DNI" valor={v.dni} />}
          {v.sexo && <Dato titulo="Sexo" valor={v.sexo} />}
          {v.edad && <Dato titulo="Edad" valor={v.edad} />}
          {v.vehiculoNro && <Dato titulo="Veh. N°" valor={v.vehiculoNro} />}
          {v.trasladoA && <Dato titulo="Traslado a" valor={v.trasladoA} />}
        </Subbloque>
      ))}
    </div>
  ),

  victimasFatales: (d) => (
    <div className="flex flex-col gap-2">
      {d.victimasFatales?.map((v, i) => (
        <Subbloque key={i} titulo={`Víctima fatal ${i + 1}`}>
          {v.nombre && <Dato titulo="Nombre y apellido" valor={v.nombre} />}
          {v.dni && <Dato titulo="DNI" valor={v.dni} />}
          {v.sexo && <Dato titulo="Sexo" valor={v.sexo} />}
        </Subbloque>
      ))}
    </div>
  ),

  animal: (d) => (
    <dl className="flex flex-col gap-2 text-sm">
      {d.animal?.propietario && <Dato titulo="Propietario/a" valor={d.animal.propietario} />}
      {d.animal?.dni && <Dato titulo="DNI" valor={d.animal.dni} />}
      {d.animal?.domicilio && <Dato titulo="Domicilio" valor={d.animal.domicilio} />}
      {d.animal?.especieRaza && <Dato titulo="Especie y raza" valor={d.animal.especieRaza} />}
    </dl>
  ),

  ferroviario: (d) => (
    <dl className="flex flex-col gap-2 text-sm">
      {d.ferroviario?.guarda && <Dato titulo="Guarda" valor={d.ferroviario.guarda} />}
      {d.ferroviario?.maquinista && <Dato titulo="Maquinista" valor={d.ferroviario.maquinista} />}
      {d.ferroviario?.recorrido && <Dato titulo="Recorrido" valor={d.ferroviario.recorrido} />}
      {d.ferroviario?.kmVia && <Dato titulo="Km de vía" valor={d.ferroviario.kmVia} />}
      {d.ferroviario?.nroTren && <Dato titulo="N° tren" valor={d.ferroviario.nroTren} />}
      {d.ferroviario?.nroCabina && <Dato titulo="N° cabina" valor={d.ferroviario.nroCabina} />}
    </dl>
  ),
};

/// Sección del detalle: envuelve el renderer correspondiente en un `<div>`
/// simple — cada renderer ya define su propia estructura (`dl` o bloques
/// repetidos), no conviene forzar un `dl` único por fuera.
function ContenidoSeccion({
  seccion,
  detalle,
}: {
  seccion: SeccionParte;
  detalle: DetalleParte;
}) {
  return <div>{RENDER_SECCION[seccion](detalle)}</div>;
}
