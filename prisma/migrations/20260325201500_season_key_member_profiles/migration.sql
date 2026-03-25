CREATE TABLE "SeasonKeyMemberProfile" (
  "id" TEXT NOT NULL,
  "season" INTEGER NOT NULL,
  "roleKey" TEXT NOT NULL,
  "roleLabel" TEXT NOT NULL,
  "memberName" TEXT NOT NULL,
  "imageData" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SeasonKeyMemberProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SeasonKeyMemberProfile_season_roleKey_key"
ON "SeasonKeyMemberProfile"("season", "roleKey");
