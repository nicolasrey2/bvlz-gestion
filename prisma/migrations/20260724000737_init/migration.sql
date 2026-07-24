-- CreateEnum
CREATE TYPE "Rango" AS ENUM ('ASPIRANTE', 'BOMBERO', 'CABO', 'CABO_PRIMERO', 'SARGENTO', 'SARGENTO_PRIMERO', 'SUBOFICIAL_PRINCIPAL', 'SUBOFICIAL_MAYOR', 'OFICIAL_AYUDANTE', 'OFICIAL_INSPECTOR', 'OFICIAL_PRINCIPAL', 'SUBCOMANDANTE', 'COMANDANTE', 'SEGUNDO_JEFE_CUERPO', 'JEFE_CUERPO');

-- CreateEnum
CREATE TYPE "RolTipo" AS ENUM ('ENCARGADO_INTERNO', 'SUB_ENCARGADO', 'ENCARGADO_AREA', 'MIEMBRO');

-- CreateTable
CREATE TABLE "destacamento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuartel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destacamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "authId" TEXT,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rango" "Rango" NOT NULL DEFAULT 'BOMBERO',
    "legajo" TEXT,
    "dni" TEXT,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "destacamentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "area" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "destacamentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignacion_rol" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "rol" "RolTipo" NOT NULL,
    "areaId" TEXT,
    "vigenteDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigenteHasta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignacion_rol_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_authId_key" ON "usuario"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_destacamentoId_idx" ON "usuario"("destacamentoId");

-- CreateIndex
CREATE INDEX "area_destacamentoId_idx" ON "area"("destacamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "area_destacamentoId_nombre_key" ON "area"("destacamentoId", "nombre");

-- CreateIndex
CREATE INDEX "asignacion_rol_usuarioId_idx" ON "asignacion_rol"("usuarioId");

-- CreateIndex
CREATE INDEX "asignacion_rol_areaId_idx" ON "asignacion_rol"("areaId");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_destacamentoId_fkey" FOREIGN KEY ("destacamentoId") REFERENCES "destacamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area" ADD CONSTRAINT "area_destacamentoId_fkey" FOREIGN KEY ("destacamentoId") REFERENCES "destacamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_rol" ADD CONSTRAINT "asignacion_rol_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_rol" ADD CONSTRAINT "asignacion_rol_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
