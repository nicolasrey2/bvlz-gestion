import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient, type Rango } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Crea el primer Encargado Interno del destacamento y lo vincula con Supabase Auth.
 *
 * Uso:
 *   pnpm crear:encargado <email> <password> <nombre> <apellido> [rango]
 *
 * Ejemplo:
 *   pnpm crear:encargado iyay@bomberos.test "ClaveSegura123" Roberto Iyay SUBOFICIAL_MAYOR
 *
 * Requiere SUPABASE_SERVICE_ROLE_KEY y DIRECT_URL en el .env.
 */

const DESTACAMENTO_ID = "dto-llavallol";

async function main() {
  const [email, password, nombre, apellido, rangoArg] = process.argv.slice(2);

  if (!email || !password || !nombre || !apellido) {
    console.error(
      "Uso: pnpm crear:encargado <email> <password> <nombre> <apellido> [rango]",
    );
    process.exit(1);
  }
  const rango = (rangoArg ?? "SUBOFICIAL_MAYOR") as Rango;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env",
    );
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    }),
  });

  // Cliente admin: usa la service_role para crear usuarios (solo servidor).
  const supabaseAdmin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1) Crear el usuario en Supabase Auth (email ya confirmado).
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`No se pudo crear el usuario en Supabase: ${error?.message}`);
    }
    const authId = data.user.id;
    console.log(`✓ Usuario Supabase Auth creado (${authId})`);

    // 2) Crear el Usuario del dominio vinculado y su rol de Encargado Interno.
    const usuario = await prisma.usuario.create({
      data: {
        authId,
        email,
        nombre,
        apellido,
        rango,
        destacamentoId: DESTACAMENTO_ID,
        asignaciones: {
          create: { rol: "ENCARGADO_INTERNO" },
        },
      },
    });
    console.log(
      `✓ Encargado Interno creado: ${usuario.nombre} ${usuario.apellido} (${rango})`,
    );
    console.log(`\nYa podés iniciar sesión en /login con: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
