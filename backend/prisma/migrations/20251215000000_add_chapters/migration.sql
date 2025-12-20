-- CreateTable
CREATE TABLE "chapters" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "chapter_order" INTEGER NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add chapter_id column to lessons (nullable)
ALTER TABLE "lessons" ADD COLUMN "chapter_id" INTEGER;

-- CreateIndex
CREATE INDEX "chapters_course_id_idx" ON "chapters"("course_id");

-- CreateIndex
CREATE INDEX "chapters_course_id_chapter_order_idx" ON "chapters"("course_id", "chapter_order");

-- CreateIndex
CREATE INDEX "chapters_is_published_idx" ON "chapters"("is_published");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_course_id_slug_key" ON "chapters"("course_id", "slug");

-- CreateIndex
CREATE INDEX "lessons_chapter_id_idx" ON "lessons"("chapter_id");

-- CreateIndex
CREATE INDEX "lessons_chapter_id_lesson_order_idx" ON "lessons"("chapter_id", "lesson_order");

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migration script: Create default chapter for each course and migrate existing lessons
-- This will be run as a separate data migration script
DO $$
DECLARE
    course_record RECORD;
    default_chapter_id INTEGER;
    lesson_record RECORD;
    lesson_order_counter INTEGER;
BEGIN
    -- Loop through all courses
    FOR course_record IN SELECT id, title FROM courses LOOP
        -- Create a default chapter for each course
        INSERT INTO chapters (course_id, title, slug, chapter_order, is_published, created_at, updated_at)
        VALUES (
            course_record.id,
            'Chương 1',
            'chuong-1',
            1,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        RETURNING id INTO default_chapter_id;
        
        -- Migrate all lessons from this course to the default chapter
        lesson_order_counter := 1;
        FOR lesson_record IN 
            SELECT id FROM lessons 
            WHERE course_id = course_record.id 
            ORDER BY lesson_order ASC
        LOOP
            UPDATE lessons 
            SET chapter_id = default_chapter_id,
                lesson_order = lesson_order_counter
            WHERE id = lesson_record.id;
            
            lesson_order_counter := lesson_order_counter + 1;
        END LOOP;
        
        RAISE NOTICE 'Created default chapter for course % and migrated % lessons', course_record.id, lesson_order_counter - 1;
    END LOOP;
END $$;

