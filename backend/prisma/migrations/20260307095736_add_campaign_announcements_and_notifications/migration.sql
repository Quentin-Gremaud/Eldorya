/*
  Warnings:

  - The `status` column on the `campaigns` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "campaign_status" AS ENUM ('active', 'archived', 'readonly');

-- DropIndex
DROP INDEX "campaigns_gm_user_id_idx";

-- AlterTable
ALTER TABLE "campaigns" DROP COLUMN "status",
ADD COLUMN     "status" "campaign_status" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "campaign_announcements" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "gm_user_id" TEXT NOT NULL,
    "gm_display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "campaign_id" TEXT,
    "reference_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_announcements_campaign_id_idx" ON "campaign_announcements"("campaign_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "campaigns_gm_user_id_status_idx" ON "campaigns"("gm_user_id", "status");

-- AddForeignKey
ALTER TABLE "campaign_announcements" ADD CONSTRAINT "campaign_announcements_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
