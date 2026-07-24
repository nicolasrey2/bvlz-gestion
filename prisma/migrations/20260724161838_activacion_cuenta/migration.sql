-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "activacionExpira" TIMESTAMP(3),
ADD COLUMN     "activacionTokenHash" TEXT,
ADD COLUMN     "cuentaActivada" BOOLEAN NOT NULL DEFAULT true;
