import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeEditarParte } from "@/lib/permisos";
import { NOMBRE_TIPO_SINIESTRO, NOMBRE_ESTADO_PARTE } from "@/lib/dominio";
import { cerrarParte } from "@/server/partes";
import { BotonAccion } from "@/components/BotonAccion";
import { fmtFechaDia, fmtFechaHora } from "@/lib/fechas";
import {
  leerDetalle,
  seccionesPresentes,
  NOMBRE_SECCION,
  ORGANISMOS_CONCURRENTES,
  type DetalleParte,
  type SeccionParte,
} from "@/lib/partesDetalle";
import { leerPersonal, type PersonaParte } from "@/lib/partePersonal";
import type { ParteIntervencion } from "@/generated/prisma/client";

/// Una de las dos tablas de personal del parte (P6). No se dibuja si está
/// vacía: un parte sin gente en el cuartel no debería mostrar el título.
function ListaPersonal({
  titulo,
  personas,
}: {
  titulo: string;
  personas: PersonaParte[];
}) {
  if (personas.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
        {titulo}
      </p>
      <ul className="mt-1 flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {personas.map((p, i) => (
          <li key={i} className="flex flex-wrap items-center gap-x-2">
            <span>{p.nombre}</span>
            {p.movil && (
              <span className="text-xs text-zinc-500">móvil {p.movil}</span>
            )}
            {p.guardia && <Etiqueta titulo="Estaba de guardia">G</Etiqueta>}
            {p.bp && <Etiqueta titulo="Avisado por busca persona">BP</Etiqueta>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/// Etiqueta corta de una columna del formulario (G, BP). `titulo` explica la
/// sigla al pasar el mouse / con lector de pantalla: "BP" no se entiende solo.
function Etiqueta({ children, titulo }: { children: ReactNode; titulo: string }) {
  return (
    <span
      title={titulo}
      className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
    >
      {children}
    </span>
  );
}

/// Los 7 tiempos del formulario oficial, en el orden en que se imprimen. Como
/// mapa y no como líneas sueltas para que la ficha no repita siete veces el
/// mismo `&&`.
const TIEMPOS = [
  { campo: "horaAviso", etiqueta: "Aviso" },
  { campo: "horaLlegada", etiqueta: "Llegada" },
  { campo: "horaCircunscripto", etiqueta: "Circunscripto" },
  { campo: "horaDominado", etiqueta: "Dominado" },
  { campo: "horaExtinguido", etiqueta: "Extinguido" },
  { campo: "horaFinalizacion", etiqueta: "Finalización" },
  { campo: "horaRegreso", etiqueta: "Regreso" },
] as const satisfies ReadonlyArray<{
  campo: keyof ParteIntervencion;
  etiqueta: string;
}>;

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

  const personal = leerPersonal(parte.personal);

  // El detalle condicional (vehículos, incendio, víctimas, etc.) se guarda
  // como Json — se lee con el helper para no confiar en su forma en runtime.
  const detalle = leerDetalle(parte.detalle);
  const secciones = seccionesPresentes(detalle);

  // Editar y cerrar tienen la misma regla: creador o conducción, con el parte
  // abierto.
  const puedeEditar = puedeEditarParte(ctx, parte);

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
          {parte.rubaNro && <Dato titulo="RUBA N°" valor={parte.rubaNro} />}
          {parte.certificadoNro && (
            <Dato titulo="Certificado" valor={parte.certificadoNro} />
          )}
          {parte.informeNro && <Dato titulo="Informe N°" valor={parte.informeNro} />}
          {parte.cuartel && <Dato titulo="Cuartel" valor={parte.cuartel} />}
          {parte.fecha && <Dato titulo="Fecha" valor={fmtFechaDia(parte.fecha)} />}
          {parte.objeto && <Dato titulo="Objeto" valor={parte.objeto} />}
          {parte.direccion && <Dato titulo="Dirección" valor={parte.direccion} />}
          {parte.localidad && <Dato titulo="Localidad" valor={parte.localidad} />}
          {parte.jurisdiccionPolicial && (
            <Dato titulo="Jurisdicción policial" valor={parte.jurisdiccionPolicial} />
          )}
          {parte.pedidoEfectuado && (
            <Dato titulo="Pedido efectuado" valor={parte.pedidoEfectuado} />
          )}
          {parte.ubicacion && <Dato titulo="Ubicación" valor={parte.ubicacion} />}
          {parte.panorama && <Dato titulo="Panorama" valor={parte.panorama} />}
          {/* Los 7 tiempos del formulario oficial, en su orden; se omiten los
              que todavía no se cargaron. */}
          {TIEMPOS.some(({ campo }) => parte[campo]) && (
            <Dato
              titulo="Tiempos"
              valor={TIEMPOS.filter(({ campo }) => parte[campo])
                .map(({ campo, etiqueta }) => `${etiqueta} ${parte[campo]}`)
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
        {personal.concurrio.length === 0 && personal.enCuartel.length === 0 ? (
          <p className="text-sm text-zinc-400 italic">Sin personal cargado.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <ListaPersonal titulo="Concurrió" personas={personal.concurrio} />
            <ListaPersonal titulo="En el cuartel" personas={personal.enCuartel} />
          </div>
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

      {(parte.datosTomadosPor ||
        parte.oficialActuante ||
        parte.dptoTecnico ||
        parte.jefeCuerpo) && (
        <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold text-zinc-500">Firmas</h2>
          <dl className="flex flex-col gap-2 text-sm">
            {parte.datosTomadosPor && (
              <Dato titulo="Datos tomados por" valor={parte.datosTomadosPor} />
            )}
            {parte.oficialActuante && (
              <Dato titulo="Oficial actuante" valor={parte.oficialActuante} />
            )}
            {parte.dptoTecnico && <Dato titulo="Dpto. Técnico" valor={parte.dptoTecnico} />}
            {parte.jefeCuerpo && <Dato titulo="Jefe del Cuerpo" valor={parte.jefeCuerpo} />}
          </dl>
        </section>
      )}

      <section className="flex flex-col gap-2">
        {puedeEditar && (
          <Link
            href={`/partes/${parte.id}/editar`}
            className="w-full rounded-lg bg-zinc-800 px-4 py-2.5 text-center text-base font-semibold text-white dark:bg-zinc-200 dark:text-zinc-900"
          >
            Editar parte
          </Link>
        )}

        <a
          href={`/partes/${parte.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-center text-base font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          Descargar PDF
        </a>

        {puedeEditar && (
          <form action={cerrarParte}>
            <input type="hidden" name="parteId" value={parte.id} />
            <BotonAccion
              className="w-full rounded-lg bg-red-700 px-4 py-2.5 text-base font-semibold text-white disabled:opacity-60"
              confirmar="¿Cerrar el parte? No se podrá editar."
              pendiente="Cerrando…"
            >
              Cerrar parte — no se podrá editar
            </BotonAccion>
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
          {v.registro && <Dato titulo="N° y origen del registro" valor={v.registro} />}
          {v.dominio && <Dato titulo="Dominio" valor={v.dominio} />}
          {v.rodado && <Dato titulo="Rodado tipo" valor={v.rodado} />}
          {(v.marca || v.modelo || v.anio) && (
            <Dato
              titulo="Vehículo"
              valor={[v.marca, v.modelo, v.anio].filter(Boolean).join(" · ")}
            />
          )}
          {v.otrosDatos && <Dato titulo="Otros datos" valor={v.otrosDatos} />}
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
      {d.inmueble?.numeroPiso && <Dato titulo="N° de piso" valor={d.inmueble.numeroPiso} />}
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
      {d.datosComplementarios?.arrendatario && (
        <Dato
          titulo="Arrendatario/a"
          valor={[
            d.datosComplementarios.arrendatario,
            d.datosComplementarios.dniArrendatario &&
              `DNI ${d.datosComplementarios.dniArrendatario}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
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

  concurrentes: (d) => (
    <dl className="flex flex-col gap-2 text-sm">
      {ORGANISMOS_CONCURRENTES.map(({ clave, label }) => {
        const organismo = d.concurrentes?.[clave];
        if (!organismo) return null;
        // Las 4 columnas del formulario se muestran en una línea; se omiten
        // las vacías para no llenar la ficha de guiones.
        const detalles = [
          organismo.numero && `N° ${organismo.numero}`,
          organismo.aCargo && `a cargo: ${organismo.aCargo}`,
          organismo.matricula && `matr./leg./DNI: ${organismo.matricula}`,
          organismo.observaciones,
        ].filter(Boolean);
        return <Dato key={clave} titulo={label} valor={detalles.join(" · ")} />;
      })}
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
