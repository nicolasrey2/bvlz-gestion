/// Esqueleto de carga genérico para los `loading.tsx` de cada sección. Da
/// feedback inmediato al navegar (las páginas son dinámicas y pegan a la DB).
export function CargandoSkeleton() {
  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-3 p-6"
      aria-busy="true"
      aria-label="Cargando…"
    >
      <div className="h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-2 h-24 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-24 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-24 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
    </main>
  );
}
