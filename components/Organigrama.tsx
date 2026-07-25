// Organigrama del destacamento como ÁRBOL VERTICAL indentado, con conectores
// CSS (ver .organigrama en app/globals.css). Mobile-first: entra en el ancho
// del celular y las áreas grandes solo se hacen más largas. Server component.

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
    <div className="organigrama">
      <ul>
        <li>
          <Nodo rol="Encargado Interno" nombre={encargado} tono="jefe" />
          <ul>
            <li>
              <Nodo rol="Sub-encargado" nombre={subEncargado} tono="sub" />
              <ul>
                {areas.map((a) => (
                  <li key={a.nombre}>
                    <Nodo rol={a.nombre} nombre={a.encargado} tono="area" />
                    {a.miembros.length > 0 && (
                      <ul>
                        {a.miembros.map((m, i) => (
                          <li key={i}>
                            <Miembro nombre={m} />
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

const TONOS = {
  jefe: "border-red-600 bg-red-50 dark:border-red-500 dark:bg-red-950/30",
  sub: "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900",
  area: "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50",
} as const;

function Nodo({
  rol,
  nombre,
  tono,
}: {
  rol: string;
  nombre: string | null;
  tono: keyof typeof TONOS;
}) {
  return (
    <div
      className={`my-0.5 inline-flex flex-col rounded-lg border px-3 py-1.5 ${TONOS[tono]}`}
    >
      <span className="text-[11px] font-semibold tracking-wide text-red-700 uppercase dark:text-red-400">
        {rol}
      </span>
      <span className="text-sm text-zinc-800 dark:text-zinc-100">
        {nombre ?? <span className="text-zinc-400 italic">sin asignar</span>}
      </span>
    </div>
  );
}

function Miembro({ nombre }: { nombre: string }) {
  return (
    <div className="py-1 text-sm text-zinc-700 dark:text-zinc-300">{nombre}</div>
  );
}
