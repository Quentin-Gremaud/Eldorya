-- DropForeignKey
ALTER TABLE "campaign_members" DROP CONSTRAINT "campaign_members_campaign_id_fkey";

-- CreateIndex
CREATE INDEX "campaign_members_user_id_idx" ON "campaign_members"("user_id");

-- CreateIndex
CREATE INDEX "campaigns_gm_user_id_idx" ON "campaigns"("gm_user_id");

-- AddForeignKey
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
