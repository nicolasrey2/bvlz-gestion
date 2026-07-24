-- CreateEnum
CREATE TYPE "TipoGuardia" AS ENUM ('INTERNA', 'CUARTELERO');

-- CreateTable
CREATE TABLE "guardia" (
    "id" TEXT NOT NULL,
    "destacamentoId" TEXT NOT NULL,
    "tipo" "TipoGuardia" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "cuarteleroNombre" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardia_participante" (
    "id" TEXT NOT NULL,
    "guardiaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "guardia_participante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guardia_destacamentoId_fecha_idx" ON "guardia"("destacamentoId", "fecha");

-- CreateIndex
CREATE INDEX "guardia_participante_usuarioId_idx" ON "guardia_participante"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "guardia_participante_guardiaId_usuarioId_key" ON "guardia_participante"("guardiaId", "usuarioId");

-- AddForeignKey
ALTER TABLE "guardia" ADD CONSTRAINT "guardia_destacamentoId_fkey" FOREIGN KEY ("destacamentoId") REFERENCES "destacamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardia_participante" ADD CONSTRAINT "guardia_participante_guardiaId_fkey" FOREIGN KEY ("guardiaId") REFERENCES "guardia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardia_participante" ADD CONSTRAINT "guardia_participante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
