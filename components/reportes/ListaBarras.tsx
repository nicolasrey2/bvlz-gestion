import { BarraHorizontal } from "@/components/reportes/BarraHorizontal";

export type ItemBarra = {
  key: string;
  label: string;
  valor: number;
  max: number;
  sufijo?: string;
  texto?: string;
  color?: string;
};

/// Lista de `BarraHorizontal` con estado vacío. Se repite igual en varias
/// secciones del dashboard (horas por persona, intervenciones por tipo,
/// tareas por área, guardias por persona), así que se saca una sola vez.
export function ListaBarras({
  items,
  vacio,
}: {
  items: ItemBarra[];
  vacio: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">{vacio}</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((i) => (
        <BarraHorizontal
          key={i.key}
          label={i.label}
          valor={i.valor}
          max={i.max}
          sufijo={i.sufijo}
          texto={i.texto}
          color={i.color}
        />
      ))}
    </div>
  );
}
