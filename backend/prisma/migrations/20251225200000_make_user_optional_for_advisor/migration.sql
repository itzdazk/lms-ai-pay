-- Make userId optional in Conversation table to support advisor conversations (public)
ALTER TABLE "public"."conversations" 
ALTER COLUMN "user_id" DROP NOT NULL;

-- Update foreign key constraint to allow NULL
ALTER TABLE "public"."conversations"
DROP CONSTRAINT IF EXISTS "conversations_user_id_fkey",
ADD CONSTRAINT "conversations_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
