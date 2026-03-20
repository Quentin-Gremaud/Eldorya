-- CreateTable
CREATE TABLE "fog_states" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "map_level_id" TEXT NOT NULL,
    "revealed_zones" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fog_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fog_states_campaign_id_player_id_map_level_id_key" ON "fog_states"("campaign_id", "player_id", "map_level_id");

-- CreateIndex
CREATE INDEX "fog_states_campaign_id_map_level_id_idx" ON "fog_states"("campaign_id", "map_level_id");
