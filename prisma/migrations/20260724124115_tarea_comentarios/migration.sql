-- CreateTable
CREATE TABLE "tarea_comentario" (
    "id" TEXT NOT NULL,
    "tareaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarea_comentario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tarea_comentario_tareaId_idx" ON "tarea_comentario"("tareaId");

-- AddForeignKey
ALTER TABLE "tarea_comentario" ADD CONSTRAINT "tarea_comentario_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_comentario" ADD CONSTRAINT "tarea_comentario_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
