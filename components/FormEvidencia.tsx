"use client";

import { useState } from "react";
import { subirEvidencia } from "@/server/tareas";

export function FormEvidencia({ tareaId }: { tareaId: string }) {
  const [subiendo, setSubiendo] = useState(false);

  return (
    <form
      action={subirEvidencia}
      onSubmit={() => setSubiendo(true)}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="tareaId" value={tareaId} />
      <input
        type="file"
        name="fotos"
        accept="image/*"
        capture="environment"
        multiple
        required
        className="text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:text-zinc-400 dark:file:bg-zinc-800"
      />
      <button
        type="submit"
        disabled={subiendo}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300"
      >
        {subiendo ? "Subiendo…" : "Subir fotos"}
      </button>
    </form>
  );
}
