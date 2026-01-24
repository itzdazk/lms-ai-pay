-- Migration: Add Trigram Indexes for AI Advisor Search Optimization
-- Purpose: Improve full-text search performance for course title, description, and content fields
-- Requires: pg_trgm extension (PostgreSQL extension for trigram similarity)

-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes on text fields for fast similarity search
-- These indexes allow efficient ILIKE queries and similarity searches

-- Index on courses.title for fast title search
CREATE INDEX IF NOT EXISTS idx_courses_title_trgm 
ON courses USING gin(title gin_trgm_ops);

-- Index on courses.short_description for fast short description search
CREATE INDEX IF NOT EXISTS idx_courses_short_description_trgm 
ON courses USING gin(short_description gin_trgm_ops);

-- Index on courses.description for fast description search
CREATE INDEX IF NOT EXISTS idx_courses_description_trgm 
ON courses USING gin(description gin_trgm_ops);

-- Index on courses.what_you_learn for fast learning outcomes search
CREATE INDEX IF NOT EXISTS idx_courses_what_you_learn_trgm 
ON courses USING gin(what_you_learn gin_trgm_ops);

-- Index on courses.course_objectives for fast objectives search
CREATE INDEX IF NOT EXISTS idx_courses_course_objectives_trgm 
ON courses USING gin(course_objectives gin_trgm_ops);

-- Index on courses.target_audience for fast audience search
CREATE INDEX IF NOT EXISTS idx_courses_target_audience_trgm 
ON courses USING gin(target_audience gin_trgm_ops);

-- Index on categories.name for fast category name search
CREATE INDEX IF NOT EXISTS idx_categories_name_trgm 
ON categories USING gin(name gin_trgm_ops);

-- Index on tags.name for fast tag name search
CREATE INDEX IF NOT EXISTS idx_tags_name_trgm 
ON tags USING gin(name gin_trgm_ops);

-- Composite index for common advisor queries: status + publishedAt + ratingAvg
-- This helps with filtering and sorting in advisor mode
CREATE INDEX IF NOT EXISTS idx_courses_advisor_query 
ON courses(status, published_at DESC NULLS LAST, rating_avg DESC NULLS LAST, enrolled_count DESC NULLS LAST)
WHERE status = 'published';

-- Note: These indexes will improve search performance significantly for:
-- - Keyword-based searches (ILIKE queries)
-- - Similarity searches (using similarity() function)
-- - Advisor mode course recommendations
-- 
-- Trade-off: Indexes increase write time slightly but dramatically improve read performance
-- Recommended: Monitor index usage with: SELECT * FROM pg_stat_user_indexes WHERE indexrelname LIKE '%_trgm%';
