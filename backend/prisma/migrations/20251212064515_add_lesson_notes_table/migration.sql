-- CreateTable
CREATE TABLE "lesson_notes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "lesson_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_notes_user_id_idx" ON "lesson_notes"("user_id");

-- CreateIndex
CREATE INDEX "lesson_notes_lesson_id_idx" ON "lesson_notes"("lesson_id");

-- CreateIndex
CREATE INDEX "lesson_notes_course_id_idx" ON "lesson_notes"("course_id");

-- CreateIndex
CREATE INDEX "lesson_notes_created_at_idx" ON "lesson_notes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_notes_user_id_lesson_id_key" ON "lesson_notes"("user_id", "lesson_id");

-- AddForeignKey
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
