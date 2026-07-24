"use client";

import { useState } from "react";

/// Botón para copiar texto (ej. el link de activación) al portapapeles, con
/// feedback breve. Reutilizable.
export function BotonCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        } catch {
          // Si el navegador bloquea el portapapeles, se copia a mano.
        }
      }}
      className="shrink-0 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white"
    >
      {copiado ? "¡Copiado!" : "Copiar"}
    </button>
  );
}
