-- DropIndex
DROP INDEX "PreGeneratedReview_companyId_isUsed_idx";

-- AlterTable
ALTER TABLE "PreGeneratedReview" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isManuallyCreated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "PreGeneratedReview_isActive_idx" ON "PreGeneratedReview"("isActive");

-- CreateIndex
CREATE INDEX "PreGeneratedReview_companyId_isUsed_isActive_idx" ON "PreGeneratedReview"("companyId", "isUsed", "isActive");

-- CreateIndex
CREATE INDEX "PreGeneratedReview_companyId_createdAt_idx" ON "PreGeneratedReview"("companyId", "createdAt");
