-- AlterTable
ALTER TABLE "product" ADD COLUMN     "embedding" JSONB,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT;
