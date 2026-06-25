-- AlterTable
ALTER TABLE "product" ADD COLUMN     "reviewSummary" JSONB,
ADD COLUMN     "reviewSummaryAt" TIMESTAMP(3);
