-- CreateEnum
CREATE TYPE "StatusTarefaProjeto" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA');

-- CreateTable
CREATE TABLE "projeto_tarefas" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "sprint" TEXT,
    "status" "StatusTarefaProjeto" NOT NULL DEFAULT 'PENDENTE',
    "autor" TEXT NOT NULL,
    "responsavel" TEXT,
    "responsavelCor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projetoId" INTEGER NOT NULL,

    CONSTRAINT "projeto_tarefas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projeto_tarefas" ADD CONSTRAINT "projeto_tarefas_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "projetos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
