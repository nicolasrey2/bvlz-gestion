/// Error inline uniforme para las Server Actions (batch 1). No renderiza nada si
/// no hay error. Server component: se puede usar en cualquier lado.
export function ErrorAccion({
  mensaje,
  className = "",
}: {
  mensaje: string | null | undefined;
  className?: string;
}) {
  if (!mensaje) return null;
  return (
    <p
      className={`text-sm text-red-600 dark:text-red-400 ${className}`}
      role="alert"
    >
      {mensaje}
    </p>
  );
}
