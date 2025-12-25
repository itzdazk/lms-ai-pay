-- Add mode field to conversations table
ALTER TABLE "public"."conversations" ADD COLUMN "mode" VARCHAR(50) NOT NULL DEFAULT 'general';

-- Create index on mode for faster queries
CREATE INDEX "conversations_mode_idx" ON "public"."conversations"("mode");

-- Create index on userId and mode for filtering conversations by mode
CREATE INDEX "conversations_user_id_mode_idx" ON "public"."conversations"("user_id", "mode");
