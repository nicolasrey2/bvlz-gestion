-- CreateEnum
CREATE TYPE "TipoNovedad" AS ENUM ('ROTURA', 'FALTANTE', 'EDILICIO', 'OBSERVACION', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoSiniestro" AS ENUM ('INCENDIO', 'RESCATE', 'ACCIDENTE_VIAL', 'FUGA_GAS', 'RESCATE_ANIMAL', 'FERROVIARIO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoParte" AS ENUM ('ABIERTO', 'CERRADO');

-- CreateTable
CREATE TABLE "novedad" (
    "id" TEXT NOT NULL,
    "destacamentoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "tipo" "TipoNovedad" NOT NULL DEFAULT 'OBSERVACION',
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "novedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parte_intervencion" (
    "id" TEXT NOT NULL,
    "destacamentoId" TEXT NOT NULL,
    "estado" "EstadoParte" NOT NULL DEFAULT 'ABIERTO',
    "tipoSiniestro" "TipoSiniestro" NOT NULL,
    "servicioNro" TEXT,
    "cuartel" TEXT,
    "fecha" TIMESTAMP(3),
    "objeto" TEXT,
    "direccion" TEXT,
    "localidad" TEXT,
    "horaAviso" TEXT,
    "horaLlegada" TEXT,
    "horaRegreso" TEXT,
    "dotaciones" INTEGER,
    "bomberos" INTEGER,
    "unidades" TEXT,
    "descripcion" TEXT,
    "detalle" JSONB,
    "personal" JSONB,
    "datosTomadosPor" TEXT,
    "oficialActuante" TEXT,
    "jefeCuerpo" TEXT,
    "creadorId" TEXT NOT NULL,
    "cerradoPorId" TEXT,
    "cerradoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parte_intervencion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "novedad_destacamentoId_createdAt_idx" ON "novedad"("destacamentoId", "createdAt");

-- CreateIndex
CREATE INDEX "parte_intervencion_destacamentoId_idx" ON "parte_intervencion"("destacamentoId");

-- AddForeignKey
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_destacamentoId_fkey" FOREIGN KEY ("destacamentoId") REFERENCES "destacamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parte_intervencion" ADD CONSTRAINT "parte_intervencion_destacamentoId_fkey" FOREIGN KEY ("destacamentoId") REFERENCES "destacamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parte_intervencion" ADD CONSTRAINT "parte_intervencion_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parte_intervencion" ADD CONSTRAINT "parte_intervencion_cerradoPorId_fkey" FOREIGN KEY ("cerradoPorId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
