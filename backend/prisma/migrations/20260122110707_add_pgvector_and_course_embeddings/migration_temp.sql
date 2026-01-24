-- TEMPORARY MIGRATION: Add columns without pgvector extension
-- Run this first if pgvector is not installed yet
-- After installing pgvector, run the main migration.sql

-- Add metadata columns for embedding tracking (can be done without extension)
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "embedding_model" VARCHAR(50);
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "embedding_updated_at" TIMESTAMPTZ;

-- Add embedding column as TEXT first (will convert to vector later)
-- Store as JSON string: '[0.1, 0.2, ...]'
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "embedding_text" TEXT;

-- Add comments
COMMENT ON COLUMN "courses"."embedding_text" IS 'Vector embedding stored as JSON string (temporary, will convert to vector type after pgvector install)';
COMMENT ON COLUMN "courses"."embedding_model" IS 'Embedding model used to generate this embedding (e.g., nomic-embed-text)';
COMMENT ON COLUMN "courses"."embedding_updated_at" IS 'Timestamp when embedding was last updated';

-- NOTE: After installing pgvector extension, run:
-- 1. ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "embedding" vector(768);
-- 2. UPDATE "courses" SET "embedding" = "embedding_text"::vector WHERE "embedding_text" IS NOT NULL;
-- 3. DROP COLUMN "embedding_text";
-- 4. CREATE INDEX using hnsw as in main migration.sql
