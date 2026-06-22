-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('flash', 'landing');

-- CreateTable
CREATE TABLE "campaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaign_slug_key" ON "campaign"("slug");

-- CreateIndex
CREATE INDEX "campaign_type_isActive_idx" ON "campaign"("type", "isActive");
