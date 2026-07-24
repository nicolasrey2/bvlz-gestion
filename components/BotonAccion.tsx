"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/// Botón de submit con feedback: se deshabilita y muestra un texto de espera
/// mientras el formulario está enviándose (usa useFormStatus de React 19, así
/// funciona con Server Actions sin convertir la action a useActionState).
/// Va SIEMPRE dentro de un <form action={serverAction}>.
/// Si se pasa `confirmar`, pide confirmación antes de enviar (para borrados).
export function BotonAccion({
  children,
  className,
  pendiente = "…",
  confirmar,
}: {
  children: ReactNode;
  className?: string;
  pendiente?: string;
  confirmar?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={className}
      onClick={
        confirmar
          ? (e) => {
              if (!window.confirm(confirmar)) e.preventDefault();
            }
          : undefined
      }
    >
      {pending ? pendiente : children}
    </button>
  );
}
