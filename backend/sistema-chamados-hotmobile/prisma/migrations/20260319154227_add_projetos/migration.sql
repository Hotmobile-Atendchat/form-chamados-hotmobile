-- CreateEnum
CREATE TYPE "StatusProjeto" AS ENUM ('NOVO', 'PLANEJAMENTO', 'EM_EXECUCAO', 'VALIDACAO', 'FINALIZADO');

-- CreateTable
CREATE TABLE "projetos" (
    "id" SERIAL NOT NULL,
    "nomeEmpresa" TEXT NOT NULL,
    "tipoProjeto" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" "StatusProjeto" NOT NULL DEFAULT 'NOVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "responsavel" TEXT,
    "responsavelCor" TEXT,
    "emails" TEXT[],
    "telefones" TEXT[],
    "anexos" JSONB,

    CONSTRAINT "projetos_pkey" PRIMARY KEY ("id")
);
