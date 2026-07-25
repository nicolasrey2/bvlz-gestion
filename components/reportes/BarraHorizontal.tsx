/// Barra horizontal (CSS) con etiqueta y valor, para los reportes. Sin
/// dependencias de gráficos.
export function BarraHorizontal({
  label,
  valor,
  max,
  sufijo = "",
  texto,
  color = "bg-red-600",
}: {
  label: string;
  valor: number;
  max: number;
  sufijo?: string;
  /// Texto a mostrar a la derecha (si no, se muestra `valor + sufijo`).
  texto?: string;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="truncate text-zinc-700 dark:text-zinc-300">{label}</span>
        <span className="shrink-0 text-zinc-500">
          {texto ?? `${valor}${sufijo}`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
