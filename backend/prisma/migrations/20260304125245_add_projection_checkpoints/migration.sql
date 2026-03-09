/*
  Warnings:

  - A unique constraint covering the columns `[clerk_user_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clerk_user_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "age_declaration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "age_declaration_timestamp" TIMESTAMP(3),
ADD COLUMN     "clerk_user_id" TEXT NOT NULL,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT;

-- CreateTable
CREATE TABLE "encryption_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encryption_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projection_checkpoints" (
    "projection_name" TEXT NOT NULL,
    "commit_position" TEXT NOT NULL,
    "prepare_position" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projection_checkpoints_pkey" PRIMARY KEY ("projection_name")
);

-- CreateIndex
CREATE UNIQUE INDEX "encryption_keys_user_id_key" ON "encryption_keys"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_user_id_key" ON "users"("clerk_user_id");
