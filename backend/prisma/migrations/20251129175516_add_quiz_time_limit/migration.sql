-- AlterTable
ALTER TABLE "quiz_submissions" ADD COLUMN     "started_at" TIMESTAMP;

-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "time_limit_minutes" INTEGER;

-- CreateIndex
CREATE INDEX "quiz_submissions_started_at_idx" ON "quiz_submissions"("started_at");
