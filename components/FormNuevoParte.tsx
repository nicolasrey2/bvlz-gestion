"use client";

import { useActionState, useState } from "react";
import { crearParte, type EstadoForm } from "@/server/partes";
import { TIPOS_SINIESTRO } from "@/lib/dominio";
import { SECCIONES_POR_SINIESTRO, type SeccionParte } from "@/lib/partesDetalle";
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

export function FormNuevoParte() {
  const [state, action, pending] = useActionState<EstadoForm, FormData>(
    crearParte,
    null,
  );

  // El tipo de siniestro elegido determina qué secciones del formulario
  // oficial se muestran (docs/parte-intervencion-DTO3.pdf). Vive en estado
  // de cliente porque solo afecta qué se renderiza, no lógica de servidor.
  const [tipo, setTipo] = useState<TipoSiniestro>(TIPOS_SINIESTRO[0].value);
  const secciones = SECCIONES_POR_SINIESTRO[tipo];
  const tiene = (s: SeccionParte) => secciones.includes(s);

  return (
    <form action={action} className="flex flex-col gap-5">
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
            <input type="date" name="fecha" className={input} />
          </label>
          <label className={label}>
            N° de servicio
            <input name="servicioNro" className={input} />
          </label>
        </div>

        <label className={label}>
          Cuartel
          <input name="cuartel" className={input} />
        </label>

        <label className={label}>
          Objeto
          <input name="objeto" placeholder="Ej. Vivienda, comercio, vehículo…" className={input} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            Dirección
            <input name="direccion" className={input} />
          </label>
          <label className={label}>
            Localidad
            <input name="localidad" className={input} />
          </label>
        </div>
      </fieldset>

      {/* Tiempos */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Tiempos</legend>
        <div className="grid grid-cols-3 gap-3">
          <label className={label}>
            Aviso
            <input type="time" name="horaAviso" className={input} />
          </label>
          <label className={label}>
            Llegada
            <input type="time" name="horaLlegada" className={input} />
          </label>
          <label className={label}>
            Regreso
            <input type="time" name="horaRegreso" className={input} />
          </label>
        </div>
      </fieldset>

      {/* Recursos */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Recursos</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            Dotaciones
            <input type="number" min={0} name="dotaciones" className={input} />
          </label>
          <label className={label}>
            Bomberos
            <input type="number" min={0} name="bomberos" className={input} />
          </label>
        </div>
        <label className={label}>
          Unidades
          <input name="unidades" placeholder="Ej. Autobomba 1, Ambulancia" className={input} />
        </label>
      </fieldset>

      {/* Descripción */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Descripción</legend>
        <label className={label}>
          Descripción de las tareas realizadas
          <textarea name="descripcion" rows={4} className={input} />
        </label>
      </fieldset>

      {/* Condiciones climáticas — solo siniestros viales */}
      {tiene("climaticas") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Condiciones climáticas</legend>
          <label className={label}>
            Condiciones climáticas
            <input name="condicionesClimaticas" placeholder="Ej. Soleado, lluvia, niebla…" className={input} />
          </label>
        </fieldset>
      )}

      {/* Vehículos — hasta 2 (accidentes viales) */}
      {tiene("vehiculos") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Vehículos</legend>
          <BloqueVehiculo n={1} />
          <BloqueVehiculo n={2} />
        </fieldset>
      )}

      {/* Análisis del incendio */}
      {tiene("incendio") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Análisis del incendio</legend>
          <label className={label}>
            Origen
            <input name="incendio_origen" className={input} />
          </label>
          <label className={label}>
            Causa
            <input name="incendio_causa" className={input} />
          </label>
          <label className={label}>
            Propagación
            <input name="incendio_propagacion" className={input} />
          </label>
          <label className={label}>
            Evolución de los deterioros
            <input name="incendio_evolucion" className={input} />
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
              <input name="inmueble_paredes" className={input} />
            </label>
            <label className={label}>
              Techos de
              <input name="inmueble_techos" className={input} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              Tipo inst. eléctrica
              <input name="inmueble_instElectrica" className={input} />
            </label>
            <label className={label}>
              Tipo inst. gas
              <input name="inmueble_instGas" className={input} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              Cant. de ambientes
              <input name="inmueble_ambientes" className={input} />
            </label>
            <label className={label}>
              Cant. de pisos
              <input name="inmueble_pisos" className={input} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              ¿Había nicho hidrante?
              <select name="inmueble_nichoHidrante" defaultValue="" className={input}>
                <option value="">Sin especificar</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </label>
            <label className={label}>
              ¿Había extintor?
              <select name="inmueble_extintor" defaultValue="" className={input}>
                <option value="">Sin especificar</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
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
            <input name="dc_propietario" className={input} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              DNI
              <input name="dc_dni" className={input} />
            </label>
            <label className={label}>
              Domicilio
              <input name="dc_domicilio" className={input} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              Cía. aseguradora
              <input name="dc_aseguradora" className={input} />
            </label>
            <label className={label}>
              Póliza N°
              <input name="dc_poliza" className={input} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              Razón social
              <input name="dc_razonSocial" className={input} />
            </label>
            <label className={label}>
              Ramo
              <input name="dc_ramo" className={input} />
            </label>
          </div>
        </fieldset>
      )}

      {/* Víctimas — hasta 4 */}
      {tiene("victimas") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Víctimas</legend>
          <BloqueVictima n={1} />
          <BloqueVictima n={2} />
          <BloqueVictima n={3} />
          <BloqueVictima n={4} />
        </fieldset>
      )}

      {/* Víctimas fatales — hasta 2 */}
      {tiene("victimasFatales") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Víctimas fatales</legend>
          <BloqueVictimaFatal n={1} />
          <BloqueVictimaFatal n={2} />
        </fieldset>
      )}

      {/* Rescate de animal */}
      {tiene("animal") && (
        <fieldset className="flex flex-col gap-3">
          <legend className={legend}>Rescate de animal</legend>
          <label className={label}>
            Propietario/a
            <input name="animal_propietario" className={input} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              DNI
              <input name="animal_dni" className={input} />
            </label>
            <label className={label}>
              Domicilio
              <input name="animal_domicilio" className={input} />
            </label>
          </div>
          <label className={label}>
            Especie y raza
            <input name="animal_especieRaza" className={input} />
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
              <input name="ferro_guarda" className={input} />
            </label>
            <label className={label}>
              Maquinista
              <input name="ferro_maquinista" className={input} />
            </label>
          </div>
          <label className={label}>
            Recorrido
            <input name="ferro_recorrido" className={input} />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className={label}>
              Km de vía
              <input name="ferro_kmVia" className={input} />
            </label>
            <label className={label}>
              N° tren
              <input name="ferro_nroTren" className={input} />
            </label>
            <label className={label}>
              N° cabina
              <input name="ferro_nroCabina" className={input} />
            </label>
          </div>
        </fieldset>
      )}

      {/* Concurrentes — aplica a todos los tipos de siniestro */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Concurrentes</legend>
        <label className={label}>
          Móvil policial
          <input
            name="conc_movilPolicial"
            placeholder="N° / a cargo de / observaciones"
            className={input}
          />
        </label>
        <label className={label}>
          Ambulancia
          <input
            name="conc_ambulancia"
            placeholder="N° / a cargo de / observaciones"
            className={input}
          />
        </label>
        <label className={label}>
          Defensa Civil
          <input
            name="conc_defensaCivil"
            placeholder="N° / a cargo de / observaciones"
            className={input}
          />
        </label>
        <label className={label}>
          Tránsito
          <input
            name="conc_transito"
            placeholder="N° / a cargo de / observaciones"
            className={input}
          />
        </label>
        <label className={label}>
          Otros
          <input
            name="conc_otros"
            placeholder="N° / a cargo de / observaciones"
            className={input}
          />
        </label>
      </fieldset>

      {/* Personal */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Personal</legend>
        <label className={label}>
          Personal que concurrió (una persona por línea)
          <textarea
            name="personal"
            rows={4}
            placeholder={"Cabo Pérez\nBombero Gómez"}
            className={input}
          />
        </label>
      </fieldset>

      {/* Firmas */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legend}>Firmas</legend>
        <label className={label}>
          Datos tomados por
          <input name="datosTomadosPor" className={input} />
        </label>
        <label className={label}>
          Oficial actuante
          <input name="oficialActuante" className={input} />
        </label>
        <label className={label}>
          Jefe del Cuerpo
          <input name="jefeCuerpo" className={input} />
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
        {pending ? "Creando…" : "Crear parte"}
      </button>
    </form>
  );
}

/// Bloque de datos de un vehículo (hasta 2, según el formulario oficial).
function BloqueVehiculo({ n }: { n: 1 | 2 }) {
  const p = `veh${n}`;
  return (
    <div className={bloque}>
      <p className={subLegend}>Vehículo {n}</p>
      <label className={label}>
        Propietario/a
        <input name={`${p}_propietario`} className={input} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Conductor/a
          <input name={`${p}_conductor`} className={input} />
        </label>
        <label className={label}>
          Edad
          <input name={`${p}_edad`} className={input} />
        </label>
      </div>
      <label className={label}>
        Domicilio
        <input name={`${p}_domicilio`} className={input} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Dominio (patente)
          <input name={`${p}_dominio`} className={input} />
        </label>
        <label className={label}>
          Marca
          <input name={`${p}_marca`} className={input} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Modelo
          <input name={`${p}_modelo`} className={input} />
        </label>
        <label className={label}>
          Año
          <input name={`${p}_anio`} className={input} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Cía. aseguradora
          <input name={`${p}_aseguradora`} className={input} />
        </label>
        <label className={label}>
          Póliza N°
          <input name={`${p}_poliza`} className={input} />
        </label>
      </div>
    </div>
  );
}

/// Bloque de datos de una víctima (hasta 4, según el formulario oficial).
function BloqueVictima({ n }: { n: 1 | 2 | 3 | 4 }) {
  const p = `vic${n}`;
  return (
    <div className={bloque}>
      <p className={subLegend}>Víctima {n}</p>
      <label className={label}>
        Nombre y apellido
        <input name={`${p}_nombre`} className={input} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          DNI
          <input name={`${p}_dni`} className={input} />
        </label>
        <label className={label}>
          Sexo
          <input name={`${p}_sexo`} className={input} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Edad
          <input name={`${p}_edad`} className={input} />
        </label>
        <label className={label}>
          Veh. N°
          <input name={`${p}_vehiculoNro`} className={input} />
        </label>
      </div>
      <label className={label}>
        Traslado a
        <input name={`${p}_trasladoA`} className={input} />
      </label>
    </div>
  );
}

/// Bloque de datos de una víctima fatal (hasta 2, según el formulario oficial).
function BloqueVictimaFatal({ n }: { n: 1 | 2 }) {
  const p = `vf${n}`;
  return (
    <div className={bloque}>
      <p className={subLegend}>Víctima fatal {n}</p>
      <label className={label}>
        Nombre y apellido
        <input name={`${p}_nombre`} className={input} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          DNI
          <input name={`${p}_dni`} className={input} />
        </label>
        <label className={label}>
          Sexo
          <input name={`${p}_sexo`} className={input} />
        </label>
      </div>
    </div>
  );
}
