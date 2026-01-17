-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "completion_threshold" DECIMAL(3,2) NOT NULL DEFAULT 0.7;
