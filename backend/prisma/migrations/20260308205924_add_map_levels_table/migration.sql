-- CreateTable
CREATE TABLE "map_levels" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "parent_id" TEXT,
    "depth" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "map_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "map_levels_campaign_id_idx" ON "map_levels"("campaign_id");

-- AddForeignKey
ALTER TABLE "map_levels" ADD CONSTRAINT "map_levels_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "map_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
