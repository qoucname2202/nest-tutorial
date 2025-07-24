-- AlterTable
ALTER TABLE "Permission" ALTER COLUMN "description" SET DEFAULT '';

-- RenameIndex
ALTER INDEX "Role_name_key" RENAME TO "role_name_unique";
