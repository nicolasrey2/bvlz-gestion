"use client";

import { useActionState, useState } from "react";
import type { EstadoForm } from "@/server/partes";
import { TIPOS_SINIESTRO } from "@/lib/dominio";
import {
  ORGANISMOS_CONCURRENTES,
  SECCIONES_POR_SINIESTRO,
  type DetalleParte,
  type SeccionParte,
  type Vehiculo,
  type Victima,
  type VictimaFatal,
} from "@/lib/partesDetalle";
import {
  CONDICIONES_CLIMATICAS,
  CUARTELES,
  JURISDICCIONES_POLICIALES,
  LOCALIDADES,
  OBJETOS,
  PANORAMAS,
  RODADOS,
} from "@/lib/parteOpciones";
import {
  SelectorPersonal,
  type SugerenciaPersonal,
} from "@/components/SelectorPersonal";
import type { PersonalParte } from "@/lib/partePersonal";
import type { TipoSiniestro } from "@/generated/prisma/client";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const label =
  "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";
const legend = "text-sm font-semibold text-zinc-500";
// Encabezado de cada bloque repetido (Vehículo 1, Víctima 2, etc.).
const subLegend = "text-xs font-semibold tracking-wide text-zinc-400 uppercase";
// Contenedor de cada bloque repetido, para separarlos visualmente.
const bloque =
  "flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700";

/// Valores iniciales del formulario. Son los campos escalares del parte tal
/// como salen de Prisma (con `null` en lo que no se cargó), más el detalle y el
/// personal ya parseados. En el alta viaja `undefined` y todo arranca vacío.
export type ValoresParte = {
  id: string;
  tipoSiniestro: TipoSiniestro;
  servicioNro: string | null;
  rubaNro: string | null;
  certificadoNro: string | null;
  informeNro: string | null;
  cuartel: string | null;
  /// Fecha en formato `aaaa-mm-dd` (lo que espera un `<input type="date">`).
  fecha: string | null;
  objeto: string | null;
  direccion: string | null;
  localidad: string | null;
  jurisdiccionPolicial: string | null;
  pedidoEfectuado: string | null;
  ubicacion: string | null;
  panorama: string | null;
  horaAviso: string | null;
  horaLlegada: string | null;
  horaCircunscripto: string | null;
  horaDominado: string | null;
  horaExtinguido: string | null;
  horaFinalizacion: string | null;
  horaRegreso: string | null;
  dotaciones: number | null;
  bomberos: number | null;
  unidades: string | null;
  descripcion: string | null;
  datosTomadosPor: string | null;
  oficialActuante: string | null;
  dptoTecnico: string | null;
  jefeCuerpo: string | null;
  detalle: DetalleParte;
  personal: PersonalParte;
};

/// Formulario del parte de intervención: **el mismo para el alta y la edición**.
///
/// El parte se completa en varias pasadas (las horas de dominado o finalización
/// se conocen bastante después del aviso), así que alta y edición muestran
/// exactamente los mismos campos; lo único que cambia es la acción que recibe
/// el submit y los valores iniciales.
export function FormParte({
  accion,
  sugerenciasPersonal,
  inicial,
}: {
  /// Server Action (`crearParte` o `editarParte`). Las dos tienen la misma
  /// firma de `useActionState`, así el componente no sabe cuál es cuál.
  accion: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  /// Personal del destacamento, para autocompletar la carga (P6). Los
  /// cuarteleros no están registrados todavía, así que el campo igual acepta
  /// texto libre — ver `SelectorPersonal`.
  sugerenciasPersonal: SugerenciaPersonal[];
  inicial?: ValoresParte;
}) {
  const [state, action, pending] = useActionState<EstadoForm, FormData>(
    accion,
    null,
  );

  // El tipo de siniestro elegido determina qué secciones del formulario
  // oficial se muestran (docs/parte-intervencion-DTO3.pdf). Vive en estado
  // de cliente porque solo afecta qué se renderiza, no lógica de servidor.
  const [tipo, setTipo] = useState<TipoSiniestro>(
    inicial?.tipoSiniestro ?? TIPOS_SINIESTRO[0].value,
  );
  const secciones = SECCIONES_POR_SINIESTRO[tipo];
  const tiene = (s: SeccionParte) => secciones.includes(s);
  const detalle = inicial?.detalle;

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* En la edición hay que decirle al servidor qué parte se está tocando. */}
      {inicial && <input type="hidden" name="parteId" value={inicial.id} />}

      {/* Datos del servicio */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Datos del servicio</legend>

        <label className={label}>
          Tipo de siniestro
          <select
            name="tipoSiniestro"
            required
            className={input}
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoSiniestro)}
          >
            {TIPOS_SINIESTRO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            Fecha
            <input
              type="date"
              name="fecha"
              defaultValue={inicial?.fecha ?? ""}
              className={input}
            />
          </label>
          <label className={label}>
            N° de servicio
            <Texto nombre="servicioNro" inicial={inicial?.servicioNro} />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <label className={label}>
            RUBA N°
            <Texto nombre="rubaNro" inicial={inicial?.rubaNro} />
          </label>
          <label className={label}>
            Certificado
            <Texto nombre="certificadoNro" inicial={inicial?.certificadoNro} />
          </label>
          <label className={label}>
            Informe N°
            <Texto nombre="informeNro" inicial={inicial?.informeNro} />
          </label>
        </div>

        <label className={label}>
          Cuartel
          <Lista nombre="cuartel" opciones={CUARTELES} inicial={inicial?.cuartel} />
        </label>

        {/* `Objeto` es la clasificación oficial del servicio: lista cerrada de
            65 opciones, no texto libre (si no coincide, el PDF terminaba con
            una opción inventada). */}
        <label className={label}>
          Objeto
          <Lista nombre="objeto" opciones={OBJETOS} inicial={inicial?.objeto} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            Dirección
            <Texto nombre="direccion" inicial={inicial?.direccion} />
          </label>
          <label className={label}>
            Localidad
            <Lista
              nombre="localidad"
              opciones={LOCALIDADES}
              inicial={inicial?.localidad}
            />
          </label>
        </div>

        <label className={label}>
          Jurisdicción policial
          <Lista
            nombre="jurisdiccionPolicial"
            opciones={JURISDICCIONES_POLICIALES}
            inicial={inicial?.jurisdiccionPolicial}
          />
        </label>

        <label className={label}>
          Pedido efectuado
          <Texto
            nombre="pedidoEfectuado"
            inicial={inicial?.pedidoEfectuado}
            placeholder="Teléfono o contacto de quien pidió"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            Ubicación
            <Texto
              nombre="ubicacion"
              inicial={inicial?.ubicacion}
              placeholder="Coordenadas o link de Google Maps"
            />
          </label>
          <label className={label}>
            Panorama
            <Lista
              nombre="panorama"
              opciones={PANORAMAS}
              inicial={inicial?.panorama}
            />
          </label>
        </div>
      </fieldset>

      {/* Tiempos — los 7 del formulario oficial, en su orden. Los intermedios
          se suelen completar después de abrir el parte (de ahí la edición). */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Tiempos</legend>
        <div className="grid grid-cols-3 gap-3">
          <Hora etiqueta="Aviso" nombre="horaAviso" inicial={inicial?.horaAviso} />
          <Hora etiqueta="Llegada" nombre="horaLlegada" inicial={inicial?.horaLlegada} />
          <Hora
            etiqueta="Circunscripto"
            nombre="horaCircunscripto"
            inicial={inicial?.horaCircunscripto}
          />
          <Hora
            etiqueta="Dominado"
            nombre="horaDominado"
            inicial={inicial?.horaDominado}
          />
          <Hora
            etiqueta="Extinguido"
            nombre="horaExtinguido"
            inicial={inicial?.horaExtinguido}
          />
          <Hora
            etiqueta="Finalización"
            nombre="horaFinalizacion"
            inicial={inicial?.horaFinalizacion}
          />
          <Hora etiqueta="Regreso" nombre="horaRegreso" inicial={inicial?.horaRegreso} />
        </div>
      </fieldset>

      {/* Recursos */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Recursos</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            Dotaciones
            <input
              type="number"
              min={0}
              name="dotaciones"
              defaultValue={inicial?.dotaciones ?? ""}
              className={input}
            />
          </label>
          <label className={label}>
            Bomberos
            <input
              type="number"
              min={0}
              name="bomberos"
              defaultValue={inicial?.bomberos ?? ""}
              className={input}
            />
          </label>
        </div>
        <label className={label}>
          Unidades
          <Texto
            nombre="unidades"
            inicial={inicial?.unidades}
            placeholder="Números de móvil separados por comas — ej. 16, 22"
          />
        </label>
      </fieldset>

      {/* Descripción */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Descripción</legend>
        <label className={label}>
          Descripción de las tareas realizadas
          <textarea
            name="descripcion"
            rows={4}
            defaultValue={inicial?.descripcion ?? ""}
            className={input}
          />
        </label>
      </fieldset>

      {/* Condiciones climáticas — solo siniestros viales */}
      {tiene("climaticas") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Condiciones climáticas</legend>
          <label className={label}>
            Condiciones climáticas
            <Lista
              nombre="condicionesClimaticas"
              opciones={CONDICIONES_CLIMATICAS}
              inicial={detalle?.condicionesClimaticas}
            />
          </label>
        </fieldset>
      )}

      {/* Vehículos — hasta 2 (accidentes viales) */}
      {tiene("vehiculos") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Vehículos</legend>
          <BloqueVehiculo n={1} inicial={detalle?.vehiculos?.[0]} />
          <BloqueVehiculo n={2} inicial={detalle?.vehiculos?.[1]} />
        </fieldset>
      )}

      {/* Análisis del incendio */}
      {tiene("incendio") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Análisis del incendio</legend>
          <label className={label}>
            Origen
            <Texto nombre="incendio_origen" inicial={detalle?.incendio?.origen} />
          </label>
          <label className={label}>
            Causa
            <Texto nombre="incendio_causa" inicial={detalle?.incendio?.causa} />
          </label>
          <label className={label}>
            Propagación
            <Texto
              nombre="incendio_propagacion"
              inicial={detalle?.incendio?.propagacion}
            />
          </label>
          <label className={label}>
            Evolución de los deterioros
            <Texto
              nombre="incendio_evolucion"
              inicial={detalle?.incendio?.evolucion}
            />
          </label>
        </fieldset>
      )}

      {/* Descripción del inmueble */}
      {tiene("inmueble") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Descripción del inmueble</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              Paredes de
              <Texto nombre="inmueble_paredes" inicial={detalle?.inmueble?.paredes} />
            </label>
            <label className={label}>
              Techos de
              <Texto nombre="inmueble_techos" inicial={detalle?.inmueble?.techos} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              Tipo inst. eléctrica
              <Texto
                nombre="inmueble_instElectrica"
                inicial={detalle?.inmueble?.instElectrica}
              />
            </label>
            <label className={label}>
              Tipo inst. gas
              <Texto nombre="inmueble_instGas" inicial={detalle?.inmueble?.instGas} />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className={label}>
              Cant. de ambientes
              <Texto
                nombre="inmueble_ambientes"
                inicial={detalle?.inmueble?.ambientes}
              />
            </label>
            <label className={label}>
              Cant. de pisos
              <Texto nombre="inmueble_pisos" inicial={detalle?.inmueble?.pisos} />
            </label>
            {/* Distinto de "cantidad de pisos": en qué piso ocurrió. */}
            <label className={label}>
              N° de piso
              <Texto
                nombre="inmueble_numeroPiso"
                inicial={detalle?.inmueble?.numeroPiso}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              ¿Había nicho hidrante?
              <SiNo nombre="inmueble_nichoHidrante" inicial={detalle?.inmueble?.nichoHidrante} />
            </label>
            <label className={label}>
              ¿Había extintor?
              <SiNo nombre="inmueble_extintor" inicial={detalle?.inmueble?.extintor} />
            </label>
          </div>
        </fieldset>
      )}

      {/* Datos complementarios (propietario del inmueble, seguro, etc.) */}
      {tiene("datosComplementarios") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Datos complementarios</legend>
          <label className={label}>
            Propietario/a
            <Texto
              nombre="dc_propietario"
              inicial={detalle?.datosComplementarios?.propietario}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              DNI
              <Texto nombre="dc_dni" inicial={detalle?.datosComplementarios?.dni} />
            </label>
            <label className={label}>
              Domicilio
              <Texto
                nombre="dc_domicilio"
                inicial={detalle?.datosComplementarios?.domicilio}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              Arrendatario/a
              <Texto
                nombre="dc_arrendatario"
                inicial={detalle?.datosComplementarios?.arrendatario}
              />
            </label>
            <label className={label}>
              DNI arrendatario/a
              <Texto
                nombre="dc_dniArrendatario"
                inicial={detalle?.datosComplementarios?.dniArrendatario}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              Cía. aseguradora
              <Texto
                nombre="dc_aseguradora"
                inicial={detalle?.datosComplementarios?.aseguradora}
              />
            </label>
            <label className={label}>
              Póliza N°
              <Texto nombre="dc_poliza" inicial={detalle?.datosComplementarios?.poliza} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              Razón social
              <Texto
                nombre="dc_razonSocial"
                inicial={detalle?.datosComplementarios?.razonSocial}
              />
            </label>
            <label className={label}>
              Ramo
              <Texto nombre="dc_ramo" inicial={detalle?.datosComplementarios?.ramo} />
            </label>
          </div>
        </fieldset>
      )}

      {/* Víctimas — hasta 4 */}
      {tiene("victimas") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Víctimas</legend>
          {[1, 2, 3, 4].map((n) => (
            <BloqueVictima
              key={n}
              n={n as 1 | 2 | 3 | 4}
              inicial={detalle?.victimas?.[n - 1]}
            />
          ))}
        </fieldset>
      )}

      {/* Víctimas fatales — hasta 2 */}
      {tiene("victimasFatales") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Víctimas fatales</legend>
          <BloqueVictimaFatal n={1} inicial={detalle?.victimasFatales?.[0]} />
          <BloqueVictimaFatal n={2} inicial={detalle?.victimasFatales?.[1]} />
        </fieldset>
      )}

      {/* Rescate de animal */}
      {tiene("animal") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Rescate de animal</legend>
          <label className={label}>
            Propietario/a
            <Texto nombre="animal_propietario" inicial={detalle?.animal?.propietario} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              DNI
              <Texto nombre="animal_dni" inicial={detalle?.animal?.dni} />
            </label>
            <label className={label}>
              Domicilio
              <Texto nombre="animal_domicilio" inicial={detalle?.animal?.domicilio} />
            </label>
          </div>
          <label className={label}>
            Especie y raza
            <Texto nombre="animal_especieRaza" inicial={detalle?.animal?.especieRaza} />
          </label>
        </fieldset>
      )}

      {/* Siniestro ferroviario */}
      {tiene("ferroviario") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Siniestro ferroviario</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              Guarda
              <Texto nombre="ferro_guarda" inicial={detalle?.ferroviario?.guarda} />
            </label>
            <label className={label}>
              Maquinista
              <Texto nombre="ferro_maquinista" inicial={detalle?.ferroviario?.maquinista} />
            </label>
          </div>
          <label className={label}>
            Recorrido
            <Texto nombre="ferro_recorrido" inicial={detalle?.ferroviario?.recorrido} />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className={label}>
              Km de vía
              <Texto nombre="ferro_kmVia" inicial={detalle?.ferroviario?.kmVia} />
            </label>
            <label className={label}>
              N° tren
              <Texto nombre="ferro_nroTren" inicial={detalle?.ferroviario?.nroTren} />
            </label>
            <label className={label}>
              N° cabina
              <Texto nombre="ferro_nroCabina" inicial={detalle?.ferroviario?.nroCabina} />
            </label>
          </div>
        </fieldset>
      )}

      {/* Concurrentes — aplica a todos los tipos de siniestro. Una fila por
          organismo con las 4 columnas del formulario oficial (P6). */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Concurrentes</legend>
        {ORGANISMOS_CONCURRENTES.map(({ clave, label: nombre }) => {
          const organismo = detalle?.concurrentes?.[clave];
          return (
            <div key={clave} className={bloque}>
              <p className={subLegend}>{nombre}</p>
              <div className="grid grid-cols-2 gap-2">
                <label className={label}>
                  N°
                  <Texto nombre={`conc_${clave}_numero`} inicial={organismo?.numero} />
                </label>
                <label className={label}>
                  Matr./Leg./DNI
                  <Texto
                    nombre={`conc_${clave}_matricula`}
                    inicial={organismo?.matricula}
                  />
                </label>
              </div>
              <label className={label}>
                A cargo
                <Texto nombre={`conc_${clave}_aCargo`} inicial={organismo?.aCargo} />
              </label>
              <label className={label}>
                Observaciones
                <Texto
                  nombre={`conc_${clave}_observaciones`}
                  inicial={organismo?.observaciones}
                />
              </label>
            </div>
          );
        })}
      </fieldset>

      {/* Personal — las dos tablas del formulario oficial (P6). */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Personal</legend>
        <SelectorPersonal
          sugerencias={sugerenciasPersonal}
          inicial={inicial?.personal}
        />
      </fieldset>

      {/* Firmas */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Firmas</legend>
        <label className={label}>
          Datos tomados por
          <Texto nombre="datosTomadosPor" inicial={inicial?.datosTomadosPor} />
        </label>
        <label className={label}>
          Oficial actuante
          <Texto nombre="oficialActuante" inicial={inicial?.oficialActuante} />
        </label>
        <label className={label}>
          Dpto. Técnico
          <Texto nombre="dptoTecnico" inicial={inicial?.dptoTecnico} />
        </label>
        <label className={label}>
          Jefe del Cuerpo
          <Texto nombre="jefeCuerpo" inicial={inicial?.jefeCuerpo} />
        </label>
      </fieldset>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-red-700 px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
      >
        {inicial
          ? pending
            ? "Guardando…"
            : "Guardar cambios"
          : pending
            ? "Creando…"
            : "Crear parte"}
      </button>
    </form>
  );
}

// --- Campos reutilizables -----------------------------------------------------

/// Input de texto con su valor inicial. Existe para no repetir el
/// `defaultValue={... ?? ""}` en los ~60 campos del formulario oficial.
function Texto({
  nombre,
  inicial,
  placeholder,
}: {
  nombre: string;
  inicial?: string | null;
  placeholder?: string;
}) {
  return (
    <input
      name={nombre}
      defaultValue={inicial ?? ""}
      placeholder={placeholder}
      className={input}
    />
  );
}

/// `<select>` de una de las listas cerradas del formulario oficial
/// (`lib/parteOpciones.ts`).
///
/// Siempre ofrece "Sin especificar": el parte se completa en varias pasadas y
/// no queremos forzar una elección al abrirlo. Si el parte ya tenía un valor
/// que no está en la lista (partes viejos, cargados como texto libre), se
/// agrega como opción para no perderlo silenciosamente al guardar.
function Lista({
  nombre,
  opciones,
  inicial,
}: {
  nombre: string;
  opciones: readonly string[];
  inicial?: string | null;
}) {
  const fueraDeLista = inicial && !opciones.includes(inicial) ? inicial : null;
  return (
    <select name={nombre} defaultValue={inicial ?? ""} className={input}>
      <option value="">Sin especificar</option>
      {fueraDeLista && <option value={fueraDeLista}>{fueraDeLista} (cargado a mano)</option>}
      {opciones.map((opcion) => (
        <option key={opcion} value={opcion}>
          {opcion}
        </option>
      ))}
    </select>
  );
}

/// `<select>` Sí / No / sin especificar de los booleanos del inmueble.
function SiNo({ nombre, inicial }: { nombre: string; inicial?: boolean }) {
  const valor = inicial === undefined ? "" : inicial ? "si" : "no";
  return (
    <select name={nombre} defaultValue={valor} className={input}>
      <option value="">Sin especificar</option>
      <option value="si">Sí</option>
      <option value="no">No</option>
    </select>
  );
}

/// Campo de hora (HH:MM) de la grilla de tiempos.
function Hora({
  etiqueta,
  nombre,
  inicial,
}: {
  etiqueta: string;
  nombre: string;
  inicial?: string | null;
}) {
  return (
    <label className={label}>
      {etiqueta}
      <input
        type="time"
        name={nombre}
        defaultValue={inicial ?? ""}
        className={input}
      />
    </label>
  );
}

/// Bloque de datos de un vehículo (hasta 2, según el formulario oficial).
function BloqueVehiculo({ n, inicial }: { n: 1 | 2; inicial?: Vehiculo }) {
  const p = `veh${n}`;
  return (
    <div className={bloque}>
      <p className={subLegend}>Vehículo {n}</p>
      <label className={label}>
        Propietario/a
        <Texto nombre={`${p}_propietario`} inicial={inicial?.propietario} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Conductor/a
          <Texto nombre={`${p}_conductor`} inicial={inicial?.conductor} />
        </label>
        <label className={label}>
          Edad
          <Texto nombre={`${p}_edad`} inicial={inicial?.edad} />
        </label>
      </div>
      <label className={label}>
        Domicilio
        <Texto nombre={`${p}_domicilio`} inicial={inicial?.domicilio} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          N° y origen del registro
          <Texto nombre={`${p}_registro`} inicial={inicial?.registro} />
        </label>
        <label className={label}>
          Rodado tipo
          <Lista nombre={`${p}_rodado`} opciones={RODADOS} inicial={inicial?.rodado} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Dominio (chapa)
          <Texto nombre={`${p}_dominio`} inicial={inicial?.dominio} />
        </label>
        <label className={label}>
          Marca
          <Texto nombre={`${p}_marca`} inicial={inicial?.marca} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Modelo
          <Texto nombre={`${p}_modelo`} inicial={inicial?.modelo} />
        </label>
        <label className={label}>
          Año
          <Texto nombre={`${p}_anio`} inicial={inicial?.anio} />
        </label>
      </div>
      <label className={label}>
        Otros datos
        <Texto nombre={`${p}_otrosDatos`} inicial={inicial?.otrosDatos} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Cía. aseguradora
          <Texto nombre={`${p}_aseguradora`} inicial={inicial?.aseguradora} />
        </label>
        <label className={label}>
          Póliza N°
          <Texto nombre={`${p}_poliza`} inicial={inicial?.poliza} />
        </label>
      </div>
    </div>
  );
}

/// Bloque de datos de una víctima (hasta 4, según el formulario oficial).
function BloqueVictima({ n, inicial }: { n: 1 | 2 | 3 | 4; inicial?: Victima }) {
  const p = `vic${n}`;
  return (
    <div className={bloque}>
      <p className={subLegend}>Víctima {n}</p>
      <label className={label}>
        Nombre y apellido
        <Texto nombre={`${p}_nombre`} inicial={inicial?.nombre} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          DNI
          <Texto nombre={`${p}_dni`} inicial={inicial?.dni} />
        </label>
        <label className={label}>
          Sexo
          <Texto nombre={`${p}_sexo`} inicial={inicial?.sexo} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Edad
          <Texto nombre={`${p}_edad`} inicial={inicial?.edad} />
        </label>
        <label className={label}>
          Veh. N°
          <Texto nombre={`${p}_vehiculoNro`} inicial={inicial?.vehiculoNro} />
        </label>
      </div>
      <label className={label}>
        Traslado a
        <Texto nombre={`${p}_trasladoA`} inicial={inicial?.trasladoA} />
      </label>
    </div>
  );
}

/// Bloque de datos de una víctima fatal (hasta 2, según el formulario oficial).
function BloqueVictimaFatal({ n, inicial }: { n: 1 | 2; inicial?: VictimaFatal }) {
  const p = `vf${n}`;
  return (
    <div className={bloque}>
      <p className={subLegend}>Víctima fatal {n}</p>
      <label className={label}>
        Nombre y apellido
        <Texto nombre={`${p}_nombre`} inicial={inicial?.nombre} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          DNI
          <Texto nombre={`${p}_dni`} inicial={inicial?.dni} />
        </label>
        <label className={label}>
          Sexo
          <Texto nombre={`${p}_sexo`} inicial={inicial?.sexo} />
        </label>
      </div>
    </div>
  );
}
