-- CreateEnum
CREATE TYPE "MemberApprovalStatus" AS ENUM ('approved', 'pending');

-- AlterEnum
ALTER TYPE "MemberRole" ADD VALUE 'admin';

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "approvalStatus" "MemberApprovalStatus" NOT NULL DEFAULT 'approved';
