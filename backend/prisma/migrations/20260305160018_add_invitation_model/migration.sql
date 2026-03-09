-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMP(3),
    "used_by_user_id" TEXT,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");

-- CreateIndex
CREATE INDEX "invitations_campaign_id_idx" ON "invitations"("campaign_id");

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
