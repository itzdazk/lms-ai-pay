-- Create unique index to enforce at most one quiz per lesson
-- Allows multiple NULL lesson_id entries (non-lesson quizzes), but ensures
-- no more than one quiz for any specific lesson.

-- Note: If duplicates currently exist, this will fail.
-- Resolve duplicates before applying, or adjust data migration accordingly.

CREATE UNIQUE INDEX IF NOT EXISTS "quizzes_lesson_id_key" ON "quizzes"("lesson_id");
