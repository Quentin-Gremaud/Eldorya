-- AlterTable
ALTER TABLE "session_actions" ADD COLUMN "queue_position" INTEGER NOT NULL DEFAULT 0;
