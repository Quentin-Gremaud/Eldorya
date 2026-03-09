-- CreateEnum
CREATE TYPE "character_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "race" TEXT NOT NULL,
    "character_class" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "stats" JSONB NOT NULL,
    "spells" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "character_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "characters_campaign_id_user_id_key" ON "characters"("campaign_id", "user_id");
