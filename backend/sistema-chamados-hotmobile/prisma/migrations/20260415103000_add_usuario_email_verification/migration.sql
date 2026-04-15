ALTER TABLE "usuarios"
ADD COLUMN "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "tokenVerificacao" TEXT,
ADD COLUMN "tokenVerificacaoExpiraEm" TIMESTAMP(3);

CREATE UNIQUE INDEX "usuarios_tokenVerificacao_key" ON "usuarios"("tokenVerificacao");
