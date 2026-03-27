CREATE TYPE "TreasurerChargeKind" AS ENUM ('membership', 'outing', 'custom');

CREATE TABLE "TreasurerCharge" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "chargeKind" "TreasurerChargeKind" NOT NULL,
  "season" INTEGER NOT NULL,
  "amount" DECIMAL(8,2) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "notes" TEXT,
  "outingId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TreasurerCharge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TreasurerPayment" (
  "id" TEXT NOT NULL,
  "chargeId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "amount" DECIMAL(8,2) NOT NULL,
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TreasurerPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TreasurerCharge_season_createdAt_idx"
ON "TreasurerCharge"("season", "createdAt");

CREATE INDEX "TreasurerPayment_chargeId_memberId_idx"
ON "TreasurerPayment"("chargeId", "memberId");

ALTER TABLE "TreasurerCharge"
ADD CONSTRAINT "TreasurerCharge_outingId_fkey"
FOREIGN KEY ("outingId") REFERENCES "Outing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TreasurerPayment"
ADD CONSTRAINT "TreasurerPayment_chargeId_fkey"
FOREIGN KEY ("chargeId") REFERENCES "TreasurerCharge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TreasurerPayment"
ADD CONSTRAINT "TreasurerPayment_memberId_fkey"
FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
