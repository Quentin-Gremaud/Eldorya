-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "pipeline_mode" VARCHAR(20) NOT NULL DEFAULT 'optional';
