-- CreateTable
CREATE TABLE "inventories" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "equipment_slots" JSONB NOT NULL DEFAULT '{}',
    "backpack_items" JSONB NOT NULL DEFAULT '[]',
    "current_weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_capacity" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "inventory_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "slot_type" TEXT NOT NULL,
    "stat_modifiers" JSONB NOT NULL DEFAULT '{}',
    "position" INTEGER,
    "equipped_slot" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventories_character_id_key" ON "inventories"("character_id");

-- CreateIndex
CREATE INDEX "inventories_campaign_id_idx" ON "inventories"("campaign_id");

-- CreateIndex
CREATE INDEX "inventory_items_inventory_id_idx" ON "inventory_items"("inventory_id");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
