-- STEP 2: Enable pgvector extension and convert embedding column
-- Run this migration AFTER installing pgvector extension on PostgreSQL
-- See docs/PGVECTOR_WINDOWS_INSTALL.md for installation instructions

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Convert embedding column from TEXT to vector(768)
-- First, add new vector column
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "embedding_vector" vector(768);

-- Migrate data from TEXT to vector (if embeddings exist)
-- Format: '[0.1, 0.2, ...]' -> vector(768)
UPDATE "courses"
SET "embedding_vector" = "embedding"::vector
WHERE "embedding" IS NOT NULL 
  AND "embedding" != ''
  AND "embedding" ~ '^\[.*\]$'; -- Valid JSON array format

-- Drop old TEXT column
ALTER TABLE "courses" DROP COLUMN IF EXISTS "embedding";

-- Rename new column to original name
ALTER TABLE "courses" RENAME COLUMN "embedding_vector" TO "embedding";

-- Create HNSW index for fast vector similarity search
-- Using cosine distance operator (<=>)
CREATE INDEX IF NOT EXISTS "courses_embedding_hnsw_idx" 
ON "courses" 
USING hnsw ("embedding" vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create composite index for hybrid search (vector + metadata filters)
CREATE INDEX IF NOT EXISTS "courses_hybrid_search_idx" 
ON "courses" 
USING btree ("status", "published_at" DESC, "rating_avg" DESC, "enrolled_count" DESC)
WHERE "embedding" IS NOT NULL;

-- Update comments
COMMENT ON COLUMN "courses"."embedding" IS 'Vector embedding for semantic search (768 dimensions for nomic-embed-text)';
