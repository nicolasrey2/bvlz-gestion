-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('PENDIENTE', 'EN_REVISION', 'COMPLETA');

-- CreateTable
CREATE TABLE "tarea" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "estado" "EstadoTarea" NOT NULL DEFAULT 'PENDIENTE',
    "fechaLimite" TIMESTAMP(3),
    "destacamentoId" TEXT NOT NULL,
    "areaId" TEXT,
    "creadorId" TEXT NOT NULL,
    "aprobadorId" TEXT,
    "aprobadaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarea_asignado" (
    "id" TEXT NOT NULL,
    "tareaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "tarea_asignado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarea_adjunto" (
    "id" TEXT NOT NULL,
    "tareaId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "subidoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarea_adjunto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tarea_destacamentoId_idx" ON "tarea"("destacamentoId");

-- CreateIndex
CREATE INDEX "tarea_areaId_idx" ON "tarea"("areaId");

-- CreateIndex
CREATE INDEX "tarea_asignado_usuarioId_idx" ON "tarea_asignado"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "tarea_asignado_tareaId_usuarioId_key" ON "tarea_asignado"("tareaId", "usuarioId");

-- CreateIndex
CREATE INDEX "tarea_adjunto_tareaId_idx" ON "tarea_adjunto"("tareaId");

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_destacamentoId_fkey" FOREIGN KEY ("destacamentoId") REFERENCES "destacamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_aprobadorId_fkey" FOREIGN KEY ("aprobadorId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_asignado" ADD CONSTRAINT "tarea_asignado_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_asignado" ADD CONSTRAINT "tarea_asignado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_adjunto" ADD CONSTRAINT "tarea_adjunto_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_adjunto" ADD CONSTRAINT "tarea_adjunto_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
