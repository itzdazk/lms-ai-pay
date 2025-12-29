-- CreateTable: Create questions table for normalized quiz questions
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
    "options" JSONB,
    "correct_answer" VARCHAR(255),
    "explanation" TEXT,
    "question_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questions_quiz_id_idx" ON "questions"("quiz_id");
CREATE INDEX "questions_question_order_idx" ON "questions"("question_order");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: Move questions from quiz.questions JSON to questions table
-- This script iterates through each quiz and converts its JSON questions array to rows
DO $$
DECLARE
    quiz_record RECORD;
    question JSONB;
    question_idx INTEGER;
    question_order_counter INTEGER;
BEGIN
    -- Loop through all quizzes
    FOR quiz_record IN SELECT id, questions FROM quizzes WHERE questions IS NOT NULL LOOP
        question_order_counter := 1;
        
        -- Handle if questions is an array
        IF jsonb_typeof(quiz_record.questions) = 'array' THEN
            -- Iterate through each question in the JSON array
            FOR question IN SELECT jsonb_array_elements(quiz_record.questions) LOOP
                INSERT INTO "questions" (
                    "quiz_id",
                    "question",
                    "type",
                    "options",
                    "correct_answer",
                    "explanation",
                    "question_order",
                    "created_at",
                    "updated_at"
                ) VALUES (
                    quiz_record.id,
                    COALESCE(question->>'question', 'Unnamed Question'),
                    COALESCE(question->>'type', 'multiple_choice'),
                    question->'options',
                    question->>'correctAnswer',
                    question->>'explanation',
                    question_order_counter,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                );
                
                question_order_counter := question_order_counter + 1;
            END LOOP;
        END IF;
        
        IF question_order_counter > 1 THEN
            RAISE NOTICE 'Migrated % questions for quiz %', question_order_counter - 1, quiz_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Successfully migrated all quiz questions to questions table';
END $$;
