-- CreateTable
CREATE TABLE "sourcing_record" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierUrl" TEXT,
    "unitCostCNY" INTEGER NOT NULL,
    "shippingCost" INTEGER NOT NULL,
    "batchQty" INTEGER NOT NULL,
    "landedCostBDT" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sourcing_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sourcing_record_productId_purchasedAt_idx" ON "sourcing_record"("productId", "purchasedAt");

-- AddForeignKey
ALTER TABLE "sourcing_record" ADD CONSTRAINT "sourcing_record_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
