import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// El seed es una tarea de CLI: usar la conexión directa (session pooler).
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  }),
});

// Áreas estándar del destacamento (ver docs/PRD.md §3.3).
const AREAS = [
  "Automotores",
  "Materiales de Incendio y Salvamento",
  "Oficina",
  "Edilicio",
  "Suministros",
];

async function main() {
  const dto = await prisma.destacamento.upsert({
    where: { id: "dto-llavallol" },
    update: {},
    create: {
      id: "dto-llavallol",
      nombre: "Destacamento N°3 Llavallol",
      cuartel: "Llavallol",
    },
  });
  console.log(`✓ Destacamento: ${dto.nombre}`);

  for (const nombre of AREAS) {
    await prisma.area.upsert({
      where: { destacamentoId_nombre: { destacamentoId: dto.id, nombre } },
      update: {},
      create: { nombre, destacamentoId: dto.id },
    });
    console.log(`  ✓ Área: ${nombre}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
