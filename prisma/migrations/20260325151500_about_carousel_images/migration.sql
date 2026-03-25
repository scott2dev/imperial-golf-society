CREATE TABLE "AboutCarouselImage" (
  "id" TEXT NOT NULL,
  "imageData" TEXT NOT NULL,
  "tagline" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AboutCarouselImage_pkey" PRIMARY KEY ("id")
);
