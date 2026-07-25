-- AlterTable
ALTER TABLE "guardia" ADD COLUMN     "cuarteleroId" TEXT;

-- CreateTable
CREATE TABLE "parte_adjunto" (
    "id" TEXT NOT NULL,
    "parteId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "subidoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parte_adjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novedad_adjunto" (
    "id" TEXT NOT NULL,
    "novedadId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "subidoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "novedad_adjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuartelero_externo" (
    "id" TEXT NOT NULL,
    "destacamentoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuartelero_externo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parte_adjunto_parteId_idx" ON "parte_adjunto"("parteId");

-- CreateIndex
CREATE INDEX "novedad_adjunto_novedadId_idx" ON "novedad_adjunto"("novedadId");

-- CreateIndex
CREATE INDEX "cuartelero_externo_destacamentoId_idx" ON "cuartelero_externo"("destacamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "cuartelero_externo_destacamentoId_nombre_key" ON "cuartelero_externo"("destacamentoId", "nombre");

-- AddForeignKey
ALTER TABLE "guardia" ADD CONSTRAINT "guardia_cuarteleroId_fkey" FOREIGN KEY ("cuarteleroId") REFERENCES "cuartelero_externo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parte_adjunto" ADD CONSTRAINT "parte_adjunto_parteId_fkey" FOREIGN KEY ("parteId") REFERENCES "parte_intervencion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parte_adjunto" ADD CONSTRAINT "parte_adjunto_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedad_adjunto" ADD CONSTRAINT "novedad_adjunto_novedadId_fkey" FOREIGN KEY ("novedadId") REFERENCES "novedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedad_adjunto" ADD CONSTRAINT "novedad_adjunto_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuartelero_externo" ADD CONSTRAINT "cuartelero_externo_destacamentoId_fkey" FOREIGN KEY ("destacamentoId") REFERENCES "destacamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

