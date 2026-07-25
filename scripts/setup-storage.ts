import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

/**
 * Crea (idempotente) los buckets privados de Storage:
 *   - "tareas"    → evidencia fotográfica de tareas
 *   - "novedades" → fotos del cuaderno de novedades (batch 1)
 *   - "partes"    → fotos de partes de intervención (batch 1)
 * Uso: pnpm setup:storage
 */

// Buckets a crear. Mismas restricciones (privados, 10MB, imágenes).
const BUCKETS = ["tareas", "novedades", "partes"] as const;

const OPCIONES = {
  public: false,
  fileSizeLimit: "10MB",
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });

  for (const bucket of BUCKETS) {
    const { error } = await admin.storage.createBucket(bucket, OPCIONES);
    if (error) {
      if (error.message.toLowerCase().includes("already exists")) {
        console.log(`Bucket '${bucket}' ya existe. OK.`);
        continue;
      }
      throw error;
    }
    console.log(`✓ Bucket '${bucket}' creado (privado).`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
