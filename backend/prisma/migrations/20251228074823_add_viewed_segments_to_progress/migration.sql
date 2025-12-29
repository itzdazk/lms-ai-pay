-- AlterTable
ALTER TABLE "progress" ADD COLUMN     "viewed_segments" JSONB;

-- AlterTable
ALTER TABLE "questions" ALTER COLUMN "options" SET DEFAULT '[]';

-- AlterTable
ALTER TABLE "quizzes" ALTER COLUMN "questions" SET DEFAULT '[]';
