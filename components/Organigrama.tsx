// Organigrama del destacamento dibujado con conectores CSS (ver .organigrama en
// app/globals.css). Server component: solo markup + CSS, sin dependencias.

export type NodoArea = {
  nombre: string;
  encargado: string | null;
  miembros: string[];
};

export function Organigrama({
  encargado,
  subEncargado,
  areas,
}: {
  encargado: string | null;
  subEncargado: string | null;
  areas: NodoArea[];
}) {
  return (
    <div className="organigrama overflow-x-auto pb-2">
      <div className="min-w-max px-2">
        <ul>
          <li>
            <NodoConduccion rol="Encargado Interno" persona={encargado} destacado />
            <ul>
              <li>
                <NodoConduccion rol="Sub-encargado" persona={subEncargado} />
                <ul>
                  {areas.map((a) => (
                    <li key={a.nombre}>
                      <NodoArea area={a} />
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}

function NodoConduccion({
  rol,
  persona,
  destacado,
}: {
  rol: string;
  persona: string | null;
  destacado?: boolean;
}) {
  return (
    <div
      className={`inline-block max-w-[15rem] rounded-xl border px-4 py-2 shadow-sm ${
        destacado
          ? "border-red-600 bg-red-50 dark:border-red-500 dark:bg-red-950/30"
          : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
      }`}
    >
      <div className="text-[11px] font-semibold tracking-wide text-red-700 uppercase dark:text-red-400">
        {rol}
      </div>
      <div className="text-sm text-zinc-800 dark:text-zinc-100">
        {persona ?? <span className="text-zinc-400 italic">sin asignar</span>}
      </div>
    </div>
  );
}

function NodoArea({ area }: { area: NodoArea }) {
  return (
    <div className="inline-block w-40 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-left align-top shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {area.nombre}
      </div>
      <div className="mt-1 text-[11px] font-medium text-zinc-400 uppercase">
        Encargado
      </div>
      <div className="text-xs text-zinc-800 dark:text-zinc-200">
        {area.encargado ?? (
          <span className="text-zinc-400 italic">sin asignar</span>
        )}
      </div>
      <div className="mt-1 text-[11px] font-medium text-zinc-400 uppercase">
        Miembros
      </div>
      {area.miembros.length > 0 ? (
        <ul className="text-xs text-zinc-800 dark:text-zinc-200">
          {area.miembros.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      ) : (
        <span className="text-xs text-zinc-400 italic">—</span>
      )}
    </div>
  );
}
