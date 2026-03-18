-- CreateTable
CREATE TABLE "session_actions" (
  "id" VARCHAR NOT NULL,
  "session_id" VARCHAR NOT NULL,
  "campaign_id" VARCHAR NOT NULL,
  "player_id" VARCHAR NOT NULL,
  "action_type" VARCHAR NOT NULL,
  "description" TEXT NOT NULL,
  "target" VARCHAR,
  "status" VARCHAR NOT NULL DEFAULT 'pending',
  "proposed_at" TIMESTAMP(3) NOT NULL,
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "session_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_actions_session_id_status_idx" ON "session_actions"("session_id", "status");

-- CreateIndex
CREATE INDEX "session_actions_campaign_id_idx" ON "session_actions"("campaign_id");

-- CreateTable
CREATE TABLE "session_pings" (
  "id" SERIAL NOT NULL,
  "session_id" VARCHAR NOT NULL,
  "campaign_id" VARCHAR NOT NULL,
  "player_id" VARCHAR NOT NULL,
  "gm_user_id" VARCHAR NOT NULL,
  "pinged_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "session_pings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_pings_session_id_player_id_idx" ON "session_pings"("session_id", "player_id");
