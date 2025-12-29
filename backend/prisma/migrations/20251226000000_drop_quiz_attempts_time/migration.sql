-- Drop attempts/time limit columns now unused
ALTER TABLE "quizzes"
  DROP COLUMN IF EXISTS "attempts_allowed",
  DROP COLUMN IF EXISTS "time_limit_minutes";
