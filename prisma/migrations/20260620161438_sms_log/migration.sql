-- CreateTable
CREATE TABLE "sms_log" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "providerMessageId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sms_log_to_createdAt_idx" ON "sms_log"("to", "createdAt");
