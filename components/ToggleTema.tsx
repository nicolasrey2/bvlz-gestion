"use client";

import { useEffect, useState } from "react";

/// Botón para alternar entre tema claro y oscuro. Persiste la elección en
/// localStorage; el estado inicial lo fija el script de layout.
export function ToggleTema() {
  const [oscuro, setOscuro] = useState<boolean | null>(null);

  useEffect(() => {
    setOscuro(document.documentElement.classList.contains("dark"));
  }, []);

  function alternar() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("tema", next ? "oscuro" : "claro");
    setOscuro(next);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Cambiar tema"
      title="Cambiar tema"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 text-base dark:border-zinc-700"
    >
      {oscuro === null ? "" : oscuro ? "☀️" : "🌙"}
    </button>
  );
}
