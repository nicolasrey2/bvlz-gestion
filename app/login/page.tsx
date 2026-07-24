"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login, type EstadoLogin } from "./actions";
import logoCuartel from "@/public/logo-cuartel.png";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<EstadoLogin, FormData>(
    login,
    null,
  );

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-6 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          {/* Caja blanca: el logo es verde/dorado y así se lee en ambos temas. */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <Image
              src={logoCuartel}
              alt="Bomberos Voluntarios de Lomas de Zamora"
              priority
              className="h-auto w-56"
            />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Destacamento N°3 Llavallol · Gestión interna
          </p>
        </div>

        <form
          action={formAction}
          className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900"
        >
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              autoFocus
              className="rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Contraseña
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-base text-zinc-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>

          {state?.error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-red-700 px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
          >
            {pending ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}
