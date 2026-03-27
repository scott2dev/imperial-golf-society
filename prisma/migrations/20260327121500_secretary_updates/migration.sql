CREATE TABLE "SecretaryUpdate" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "imageData" TEXT,
  "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "postedByMemberId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SecretaryUpdate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SecretaryUpdate_postedAt_createdAt_idx"
ON "SecretaryUpdate"("postedAt", "createdAt");

ALTER TABLE "SecretaryUpdate"
ADD CONSTRAINT "SecretaryUpdate_postedByMemberId_fkey"
FOREIGN KEY ("postedByMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
