/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sourceFixtureId]` on the table `Outing` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "imageAlt" TEXT,
ADD COLUMN     "imageSrc" TEXT,
ADD COLUMN     "mapsUrl" TEXT,
ADD COLUMN     "websiteUrl" TEXT;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "isRegistered" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Outing" ADD COLUMN     "sourceFixtureId" TEXT,
ADD COLUMN     "teeTime" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Course_name_key" ON "Course"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Member_name_key" ON "Member"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Outing_sourceFixtureId_key" ON "Outing"("sourceFixtureId");
