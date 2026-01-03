-- Add HLS metadata columns to lessons
ALTER TABLE "lessons"
    ADD COLUMN IF NOT EXISTS "hls_url" VARCHAR(255),
    ADD COLUMN IF NOT EXISTS "hls_status" VARCHAR(20) NOT NULL DEFAULT 'idle';
