"use client";

import type { ReactNode } from "react";

/// Botón de submit para acciones destructivas: pide confirmación antes de
/// enviar el formulario. Se usa DENTRO de un <form action={serverAction}>.
export function BotonConfirmar({
  mensaje,
  className,
  children,
}: {
  mensaje: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(mensaje)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
