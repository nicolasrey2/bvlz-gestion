// Organigrama del destacamento como ÁRBOL VERTICAL indentado, con conectores
// CSS (ver .organigrama en app/globals.css). Mobile-first. Server component.
// Cada persona muestra su rango como chip separado del nombre.

export type Persona = { rango: string; nombre: string };

export type NodoArea = {
  nombre: string;
  encargado: Persona | null;
  miembros: Persona[];
};

export function Organigrama({
  encargado,
  subEncargado,
  areas,
}: {
  encargado: Persona | null;
  subEncargado: Persona | null;
  areas: NodoArea[];
}) {
  return (
    <div className="organigrama">
      <ul>
        <li>
          <Nodo rol="Encargado Interno" persona={encargado} tono="jefe" />
          <ul>
            <li>
              <Nodo rol="Sub-encargado" persona={subEncargado} tono="sub" />
              <ul>
                {areas.map((a) => (
                  <li key={a.nombre}>
                    <Nodo rol={a.nombre} persona={a.encargado} tono="area" />
                    {a.miembros.length > 0 && (
                      <ul>
                        {a.miembros.map((m, i) => (
                          <li key={i}>
                            <Miembro persona={m} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  );
}

/// Chip de rango (jerarquía), separado del nombre y con color propio.
function ChipRango({ rango }: { rango: string }) {
  return (
    <span className="shrink-0 rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
      {rango}
    </span>
  );
}

const TONOS = {
  jefe: "border-red-600 bg-red-50 dark:border-red-500 dark:bg-red-950/30",
  sub: "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900",
  area: "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50",
} as const;

function Nodo({
  rol,
  persona,
  tono,
}: {
  rol: string;
  persona: Persona | null;
  tono: keyof typeof TONOS;
}) {
  return (
    <div
      className={`my-0.5 inline-flex flex-col rounded-lg border px-3 py-1.5 ${TONOS[tono]}`}
    >
      <span className="text-[11px] font-semibold tracking-wide text-red-700 uppercase dark:text-red-400">
        {rol}
      </span>
      {persona ? (
        <span className="flex items-center gap-1.5">
          <ChipRango rango={persona.rango} />
          <span className="text-sm text-zinc-800 dark:text-zinc-100">
            {persona.nombre}
          </span>
        </span>
      ) : (
        <span className="text-sm text-zinc-400 italic">sin asignar</span>
      )}
    </div>
  );
}

function Miembro({ persona }: { persona: Persona }) {
  return (
    <div className="flex items-center gap-1.5 py-1 text-sm">
      <ChipRango rango={persona.rango} />
      <span className="text-zinc-700 dark:text-zinc-300">{persona.nombre}</span>
    </div>
  );
}
