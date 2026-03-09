-- CreateIndex
CREATE UNIQUE INDEX "notifications_reference_id_user_id_type_key" ON "notifications"("reference_id", "user_id", "type");

-- CreateIndex
CREATE INDEX "notifications_campaign_id_idx" ON "notifications"("campaign_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
