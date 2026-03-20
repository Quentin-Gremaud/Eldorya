-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "map_level_id" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "token_type" VARCHAR(20) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tokens_campaign_id_map_level_id_idx" ON "tokens"("campaign_id", "map_level_id");
