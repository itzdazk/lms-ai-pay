-- Add indexes for dashboard performance optimization
CREATE INDEX IF NOT EXISTS idx_progress_user_completed ON progress(user_id, is_completed, completed_at);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_date ON quiz_submissions(user_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON enrollments(user_id, status, enrolled_at);