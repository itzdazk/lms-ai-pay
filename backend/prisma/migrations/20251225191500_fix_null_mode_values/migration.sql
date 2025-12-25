-- Update any NULL mode values to 'general' (backward compatibility)
-- This ensures all existing conversations are visible in tutor interface
UPDATE "public"."conversations" SET "mode" = 'general' WHERE "mode" IS NULL;
