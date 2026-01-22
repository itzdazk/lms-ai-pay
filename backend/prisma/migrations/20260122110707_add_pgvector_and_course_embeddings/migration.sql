-- STEP 1: Add metadata columns (can be done without pgvector extension)
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "embedding_model" VARCHAR(50);
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "embedding_updated_at" TIMESTAMPTZ;

-- STEP 2: Add embedding column as TEXT temporarily
-- Store embeddings as JSON string until pgvector is installed
-- Format: '[0.1, 0.2, 0.3, ...]' (768 dimensions for nomic-embed-text)
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "embedding" TEXT;

-- Add comments
COMMENT ON COLUMN "courses"."embedding" IS 'Vector embedding stored as JSON string. After installing pgvector, run migration 20260122120000_enable_pgvector to convert to vector type.';
COMMENT ON COLUMN "courses"."embedding_model" IS 'Embedding model used to generate this embedding (e.g., nomic-embed-text)';
COMMENT ON COLUMN "courses"."embedding_updated_at" IS 'Timestamp when embedding was last updated';

-- NOTE: After installing pgvector extension, run the next migration:
-- 20260122120000_enable_pgvector/migration.sql
-- This will:
-- 1. Enable vector extension
-- 2. Convert embedding column from TEXT to vector(768)
-- 3. Create HNSW indexes for vector search
