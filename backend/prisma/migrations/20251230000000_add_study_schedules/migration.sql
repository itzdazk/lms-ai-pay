-- CreateTable
CREATE TABLE "study_schedules" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "lesson_id" INTEGER,
    "title" VARCHAR(200),
    "scheduled_date" TIMESTAMPTZ NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "reminder_minutes" INTEGER NOT NULL DEFAULT 15,
    "is_reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "reminder_sent_at" TIMESTAMPTZ,
    "repeat_type" VARCHAR(20),
    "repeat_days" JSONB,
    "repeat_until" TIMESTAMPTZ,
    "notes" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "study_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_schedules_user_id_idx" ON "study_schedules"("user_id");
CREATE INDEX "study_schedules_scheduled_date_idx" ON "study_schedules"("scheduled_date");
CREATE INDEX "study_schedules_course_id_idx" ON "study_schedules"("course_id");
CREATE INDEX "study_schedules_status_idx" ON "study_schedules"("status");
CREATE INDEX "study_schedules_user_id_scheduled_date_idx" ON "study_schedules"("user_id", "scheduled_date");

-- AddForeignKey
ALTER TABLE "study_schedules" ADD CONSTRAINT "study_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_schedules" ADD CONSTRAINT "study_schedules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_schedules" ADD CONSTRAINT "study_schedules_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

