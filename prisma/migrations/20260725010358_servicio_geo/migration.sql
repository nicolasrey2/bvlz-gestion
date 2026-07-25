-- AlterTable
ALTER TABLE "destacamento" ADD COLUMN     "latitud" DOUBLE PRECISION,
ADD COLUMN     "longitud" DOUBLE PRECISION,
ADD COLUMN     "radioFichadoM" INTEGER NOT NULL DEFAULT 200;

-- AlterTable
ALTER TABLE "fichada" ADD COLUMN     "distanciaM" DOUBLE PRECISION,
ADD COLUMN     "latitud" DOUBLE PRECISION,
ADD COLUMN     "longitud" DOUBLE PRECISION,
ADD COLUMN     "ubicacionVerificada" BOOLEAN NOT NULL DEFAULT false;
