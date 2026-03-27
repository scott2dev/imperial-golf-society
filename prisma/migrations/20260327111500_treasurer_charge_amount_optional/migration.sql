ALTER TYPE "TreasurerChargeKind" ADD VALUE 'captainsWeekend';

ALTER TABLE "TreasurerCharge"
ALTER COLUMN "amount" DROP NOT NULL;
