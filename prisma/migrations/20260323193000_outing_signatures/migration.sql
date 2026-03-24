-- CreateTable
CREATE TABLE "OutingSignature" (
    "id" TEXT NOT NULL,
    "outingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "groupNumber" INTEGER NOT NULL,
    "signatureData" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutingSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutingSignature_outingId_memberId_key" ON "OutingSignature"("outingId", "memberId");

-- AddForeignKey
ALTER TABLE "OutingSignature" ADD CONSTRAINT "OutingSignature_outingId_fkey" FOREIGN KEY ("outingId") REFERENCES "Outing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutingSignature" ADD CONSTRAINT "OutingSignature_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
