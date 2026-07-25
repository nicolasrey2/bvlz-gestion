/// Tile de KPI para el dashboard de reportes.
export function StatTile({
  label,
  valor,
  sub,
}: {
  label: string;
  valor: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {valor}
      </div>
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-zinc-400">{sub}</div>}
    </div>
  );
}
