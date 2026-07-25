"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/// Toasts efímeros de confirmación (batch 1). Se usan SOLO para éxitos ("Tarea
/// aprobada", "Guardia eliminada"); los errores van inline (ver lib/acciones.ts
/// y components/ui/ErrorAccion.tsx). Mobile-first: aparecen arriba y al centro,
/// lejos del toggle de tema (fijo abajo a la derecha).

type TipoToast = "exito" | "error" | "info";

type Toast = { id: number; mensaje: string; tipo: TipoToast };

type ContextoToast = {
  /// Muestra un toast. Por defecto es de éxito (el uso más común).
  mostrar: (mensaje: string, tipo?: TipoToast) => void;
};

const ToastContext = createContext<ContextoToast | null>(null);

// Cuánto queda visible cada toast antes de desaparecer.
const DURACION_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const quitar = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback(
    (mensaje: string, tipo: TipoToast = "exito") => {
      // id monotónico basado en el largo + un contador implícito por timestamp
      // de render; alcanza para diferenciar toasts simultáneos.
      const id = Date.now() + Math.floor(performance.now());
      setToasts((prev) => [...prev, { id, mensaje, tipo }]);
      setTimeout(() => quitar(id), DURACION_MS);
    },
    [quitar],
  );

  const valor = useMemo(() => ({ mostrar }), [mostrar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onCerrar={() => quitar(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const COLOR: Record<TipoToast, string> = {
  exito:
    "bg-green-700 text-white dark:bg-green-600",
  error: "bg-red-700 text-white dark:bg-red-600",
  info: "bg-zinc-800 text-white dark:bg-zinc-700",
};

function ToastItem({ toast, onCerrar }: { toast: Toast; onCerrar: () => void }) {
  // Pequeño fade-in al montar.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      type="button"
      onClick={onCerrar}
      className={`pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-center text-sm font-medium shadow-lg transition-all duration-200 ${COLOR[toast.tipo]} ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
      role={toast.tipo === "error" ? "alert" : "status"}
    >
      {toast.mensaje}
    </button>
  );
}

/// Hook para disparar toasts desde cualquier componente cliente.
export function useToast(): ContextoToast {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>.");
  }
  return ctx;
}
