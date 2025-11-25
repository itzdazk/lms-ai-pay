-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "transcript_json_url" VARCHAR(255),
ADD COLUMN     "transcript_status" VARCHAR(20) NOT NULL DEFAULT 'idle';

-- RenameIndex
ALTER INDEX "users_userName_idx" RENAME TO "users_username_idx";

-- RenameIndex
ALTER INDEX "users_userName_key" RENAME TO "users_username_key";
