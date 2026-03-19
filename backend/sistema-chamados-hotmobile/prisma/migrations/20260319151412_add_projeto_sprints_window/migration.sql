-- CreateEnum
CREATE TYPE "StatusSprintProjeto" AS ENUM ('PLANEJADA', 'ATIVA', 'CONCLUIDA');

-- AlterTable
ALTER TABLE "projeto_tarefas" DROP COLUMN "sprint",
ADD COLUMN     "sprintId" INTEGER;

-- CreateTable
CREATE TABLE "projeto_sprints" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "status" "StatusSprintProjeto" NOT NULL DEFAULT 'PLANEJADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projetoId" INTEGER NOT NULL,

    CONSTRAINT "projeto_sprints_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projeto_sprints" ADD CONSTRAINT "projeto_sprints_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "projetos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_tarefas" ADD CONSTRAINT "projeto_tarefas_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "projeto_sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
