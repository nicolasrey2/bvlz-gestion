"use client";

import { useId, useState } from "react";
import {
  CUPO_CONCURRIO,
  CUPO_EN_CUARTEL,
  type PersonaParte,
  type PersonalParte,
} from "@/lib/partePersonal";

const input =
  "rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const subLegend = "text-xs font-semibold tracking-wide text-zinc-400 uppercase";

/// Una persona del cuartel, para las sugerencias del autocompletado.
export type SugerenciaPersonal = { usuarioId: string; nombre: string };

/// Carga el personal del parte (P6): las dos tablas del formulario oficial.
///
/// **La dualidad registrado / texto libre** se resuelve con un único campo de
/// texto con `<datalist>`: sugiere al personal del destacamento mientras se
/// escribe, pero acepta cualquier cosa. Así los cuarteleros —que hoy no son
/// usuarios del sistema— se cargan a mano sin que nadie tenga que elegir un
/// "modo", y el día que se registren aparecen solos en las sugerencias.
///
/// Cuando el texto coincide con una sugerencia se guarda además el `usuarioId`
/// (trazabilidad), pero lo que se imprime en el PDF es siempre el texto: el
/// parte es un documento que se archiva y tiene que conservar el rango que la
/// persona tenía ese día.
///
/// Todo viaja en un solo campo oculto con el JSON de la lista, en vez de
/// arrays paralelos: evita que las filas se desalineen cuando un casillero
/// queda vacío o un checkbox no se envía.
export function SelectorPersonal({
  sugerencias,
  inicial,
}: {
  sugerencias: SugerenciaPersonal[];
  inicial?: PersonalParte;
}) {
  const [concurrio, setConcurrio] = useState<PersonaParte[]>(
    inicial?.concurrio ?? [],
  );
  const [enCuartel, setEnCuartel] = useState<PersonaParte[]>(
    inicial?.enCuartel ?? [],
  );
  const listaId = useId();

  return (
    <div className="flex flex-col gap-4">
      {/* Un solo <datalist> compartido por todos los inputs de nombre. */}
      <datalist id={listaId}>
        {sugerencias.map((s) => (
          <option key={s.usuarioId} value={s.nombre} />
        ))}
      </datalist>

      <TablaPersonal
        titulo="Personal que concurrió"
        personas={concurrio}
        onChange={setConcurrio}
        sugerencias={sugerencias}
        listaId={listaId}
        cupo={CUPO_CONCURRIO}
        conMovil
      />

      <TablaPersonal
        titulo="Personal en el cuartel"
        personas={enCuartel}
        onChange={setEnCuartel}
        sugerencias={sugerencias}
        listaId={listaId}
        cupo={CUPO_EN_CUARTEL}
      />

      <input
        type="hidden"
        name="personal"
        value={JSON.stringify({ concurrio, enCuartel } satisfies PersonalParte)}
      />
    </div>
  );
}

function TablaPersonal({
  titulo,
  personas,
  onChange,
  sugerencias,
  listaId,
  cupo,
  conMovil = false,
}: {
  titulo: string;
  personas: PersonaParte[];
  onChange: (personas: PersonaParte[]) => void;
  sugerencias: SugerenciaPersonal[];
  listaId: string;
  cupo: number;
  conMovil?: boolean;
}) {
  const actualizar = (i: number, cambios: Partial<PersonaParte>) =>
    onChange(personas.map((p, j) => (j === i ? { ...p, ...cambios } : p)));

  const quitar = (i: number) => onChange(personas.filter((_, j) => j !== i));

  const agregar = () => onChange([...personas, { nombre: "" }]);

  /// Al escribir el nombre se busca si coincide con alguien del cuartel para
  /// guardar su id. Si no coincide (un cuartelero, por ejemplo) queda sólo el
  /// texto — que es exactamente lo que se necesita.
  const escribirNombre = (i: number, nombre: string) => {
    const match = sugerencias.find(
      (s) => s.nombre.toLowerCase() === nombre.trim().toLowerCase(),
    );
    actualizar(i, { nombre, usuarioId: match?.usuarioId });
  };

  const excede = personas.length > cupo;

  return (
    <div className="flex flex-col gap-2">
      <p className={subLegend}>{titulo}</p>

      {personas.length === 0 && (
        <p className="text-sm text-zinc-400 italic">Sin personal cargado.</p>
      )}

      {personas.map((persona, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-700"
        >
          <div className="flex items-center gap-2">
            <input
              list={listaId}
              value={persona.nombre}
              onChange={(e) => escribirNombre(i, e.target.value)}
              placeholder="Jerarquía y apellido"
              aria-label="Jerarquía y apellido"
              className={`${input} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={() => quitar(i)}
              aria-label={`Quitar a ${persona.nombre || "esta persona"}`}
              className="shrink-0 rounded-lg px-2 py-2 text-sm font-medium text-red-700 dark:text-red-400"
            >
              Quitar
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {conMovil && (
              <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                Móvil
                <input
                  value={persona.movil ?? ""}
                  onChange={(e) => actualizar(i, { movil: e.target.value })}
                  inputMode="numeric"
                  placeholder="N°"
                  className={`${input} w-20 px-2 py-1`}
                />
              </label>
            )}
            <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={persona.guardia ?? false}
                onChange={(e) => actualizar(i, { guardia: e.target.checked })}
                className="h-4 w-4"
              />
              De guardia (G)
            </label>
            <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={persona.bp ?? false}
                onChange={(e) => actualizar(i, { bp: e.target.checked })}
                className="h-4 w-4"
              />
              Brigada (BP)
            </label>
          </div>
        </div>
      ))}

      {excede && (
        <p className="text-sm text-amber-700 dark:text-amber-400" role="alert">
          El formulario oficial tiene {cupo} casilleros en esta tabla. Los que
          sobran se guardan, pero no van a salir en el PDF.
        </p>
      )}

      <button
        type="button"
        onClick={agregar}
        className="self-start rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
      >
        + Agregar persona
      </button>
    </div>
  );
}
