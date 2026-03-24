-- AlterTable
ALTER TABLE "Outing" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imageAlt" TEXT,
ADD COLUMN     "imageSrc" TEXT,
ADD COLUMN     "sponsorName" TEXT,
ADD COLUMN     "sponsorUrl" TEXT;
