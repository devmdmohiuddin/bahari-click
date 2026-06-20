-- CreateEnum
CREATE TYPE "PreOrderStatus" AS ENUM ('pending', 'notified', 'fulfilled', 'cancelled');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'processing', 'done', 'failed');

-- CreateTable
CREATE TABLE "pre_order_request" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "status" "PreOrderStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "pre_order_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notify_job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notify_job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pre_order_request_productId_status_idx" ON "pre_order_request"("productId", "status");

-- CreateIndex
CREATE INDEX "pre_order_request_variantId_status_idx" ON "pre_order_request"("variantId", "status");

-- CreateIndex
CREATE INDEX "notify_job_status_runAt_idx" ON "notify_job"("status", "runAt");

-- AddForeignKey
ALTER TABLE "pre_order_request" ADD CONSTRAINT "pre_order_request_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_order_request" ADD CONSTRAINT "pre_order_request_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
