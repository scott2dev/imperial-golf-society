CREATE TABLE "MemberHandicapHistory" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "handicapIndex" DECIMAL(5,1) NOT NULL,
  "reason" TEXT,
  "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MemberHandicapHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MemberHandicapHistory_memberId_effectiveAt_idx"
  ON "MemberHandicapHistory"("memberId", "effectiveAt");

ALTER TABLE "MemberHandicapHistory"
  ADD CONSTRAINT "MemberHandicapHistory_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "Member"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
