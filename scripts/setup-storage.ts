import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

/**
 * Crea (idempotente) el bucket privado de Storage para la evidencia de tareas.
 * Uso: pnpm setup:storage
 */
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await admin.storage.createBucket("tareas", {
    public: false,
    fileSizeLimit: "10MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
  });

  if (error) {
    if (error.message.toLowerCase().includes("already exists")) {
      console.log("Bucket 'tareas' ya existe. OK.");
      return;
    }
    throw error;
  }
  console.log("✓ Bucket 'tareas' creado (privado).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
