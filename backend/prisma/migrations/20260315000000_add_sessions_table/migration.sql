-- CreateTable
CREATE TABLE "sessions" (
    "id" VARCHAR NOT NULL,
    "campaign_id" VARCHAR NOT NULL,
    "gm_user_id" VARCHAR NOT NULL,
    "mode" VARCHAR NOT NULL DEFAULT 'preparation',
    "status" VARCHAR NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_campaign_id_status_idx" ON "sessions"("campaign_id", "status");
