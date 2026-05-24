-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "class_id" TEXT,
ADD COLUMN     "inventory" TEXT DEFAULT '',
ADD COLUMN     "inventory_json" JSONB,
ADD COLUMN     "spells" TEXT DEFAULT '';
