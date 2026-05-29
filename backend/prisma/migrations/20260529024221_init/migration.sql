-- CreateTable
CREATE TABLE "SchemaDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schemaJson" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LLMCall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schemaName" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "variables" TEXT,
    "model" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "safeMode" BOOLEAN NOT NULL DEFAULT false,
    "partialRecovery" BOOLEAN NOT NULL DEFAULT false,
    "correctionNeeded" BOOLEAN NOT NULL,
    "attemptCount" INTEGER NOT NULL,
    "totalLatencyMs" INTEGER NOT NULL,
    "tokenUsage" TEXT,
    "validatedOutput" TEXT,
    "warnings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LLMCall_schemaName_fkey" FOREIGN KEY ("schemaName") REFERENCES "SchemaDefinition" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "callId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "rawResponse" TEXT NOT NULL,
    "parsedJson" TEXT,
    "validationError" TEXT,
    "valid" BOOLEAN NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_callId_fkey" FOREIGN KEY ("callId") REFERENCES "LLMCall" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FailureLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schemaName" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "rawResponse" TEXT NOT NULL,
    "validationError" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SchemaDefinition_name_key" ON "SchemaDefinition"("name");

-- CreateIndex
CREATE INDEX "SchemaDefinition_createdAt_idx" ON "SchemaDefinition"("createdAt");

-- CreateIndex
CREATE INDEX "LLMCall_schemaName_idx" ON "LLMCall"("schemaName");

-- CreateIndex
CREATE INDEX "LLMCall_strategy_idx" ON "LLMCall"("strategy");

-- CreateIndex
CREATE INDEX "LLMCall_createdAt_idx" ON "LLMCall"("createdAt");

-- CreateIndex
CREATE INDEX "LLMCall_success_idx" ON "LLMCall"("success");

-- CreateIndex
CREATE INDEX "Attempt_callId_idx" ON "Attempt"("callId");

-- CreateIndex
CREATE INDEX "Attempt_valid_idx" ON "Attempt"("valid");

-- CreateIndex
CREATE INDEX "Attempt_createdAt_idx" ON "Attempt"("createdAt");

-- CreateIndex
CREATE INDEX "FailureLog_schemaName_idx" ON "FailureLog"("schemaName");

-- CreateIndex
CREATE INDEX "FailureLog_strategy_idx" ON "FailureLog"("strategy");

-- CreateIndex
CREATE INDEX "FailureLog_createdAt_idx" ON "FailureLog"("createdAt");
