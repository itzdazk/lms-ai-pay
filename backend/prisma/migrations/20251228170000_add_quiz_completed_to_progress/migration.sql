-- Add quizCompleted field to Progress model
ALTER TABLE "progress" ADD COLUMN "quiz_completed" BOOLEAN NOT NULL DEFAULT false;