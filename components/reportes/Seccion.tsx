import type { ReactNode } from "react";

/// Card de sección para el dashboard de reportes: título chico + contenido.
/// Evita repetir el mismo wrapper (rounded-2xl + título) en cada bloque de la
/// página (horas, intervenciones, tareas, guardias, presentismo…).
export function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
      <h2 className="mb-2 text-sm font-semibold text-zinc-500">{titulo}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
