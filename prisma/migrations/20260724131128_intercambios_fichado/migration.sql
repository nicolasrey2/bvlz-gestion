-- CreateEnum
CREATE TYPE "TipoFichada" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateTable
CREATE TABLE "intercambio_guardia" (
    "id" TEXT NOT NULL,
    "guardiaId" TEXT NOT NULL,
    "deUsuarioId" TEXT NOT NULL,
    "aUsuarioId" TEXT NOT NULL,
    "deNombre" TEXT NOT NULL,
    "aNombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intercambio_guardia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichada" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "guardiaId" TEXT,
    "destacamentoId" TEXT NOT NULL,
    "tipo" "TipoFichada" NOT NULL,
    "momento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "noProgramada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "fichada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intercambio_guardia_guardiaId_idx" ON "intercambio_guardia"("guardiaId");

-- CreateIndex
CREATE INDEX "fichada_destacamentoId_momento_idx" ON "fichada"("destacamentoId", "momento");

-- CreateIndex
CREATE INDEX "fichada_usuarioId_idx" ON "fichada"("usuarioId");

-- AddForeignKey
ALTER TABLE "intercambio_guardia" ADD CONSTRAINT "intercambio_guardia_guardiaId_fkey" FOREIGN KEY ("guardiaId") REFERENCES "guardia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichada" ADD CONSTRAINT "fichada_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichada" ADD CONSTRAINT "fichada_guardiaId_fkey" FOREIGN KEY ("guardiaId") REFERENCES "guardia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
