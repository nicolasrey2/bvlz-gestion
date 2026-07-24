"use client";

/// Botón para alternar entre tema claro y oscuro. Persiste la elección en
/// localStorage; el estado inicial lo fija el script de layout. El ícono se
/// elige con variantes dark: (sin estado JS) para evitar parpadeos/hidratación.
export function ToggleTema() {
  function alternar() {
    const raiz = document.documentElement;
    const oscuro = !raiz.classList.contains("dark");
    raiz.classList.toggle("dark", oscuro);
    localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Cambiar tema"
      title="Cambiar tema"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {/* Luna: visible en tema claro (clic → oscuro) */}
      <svg
        className="block h-5 w-5 dark:hidden"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21.75 15a9 9 0 1 1-9.75-12 7 7 0 0 0 9.75 12Z" />
      </svg>
      {/* Sol: visible en tema oscuro (clic → claro) */}
      <svg
        className="hidden h-5 w-5 dark:block"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
