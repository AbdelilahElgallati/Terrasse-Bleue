-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "ProductOption" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ProductOptionValue" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
