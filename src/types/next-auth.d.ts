import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      memberId?: string;
      role?: "member" | "captain" | "admin";
      handicapIndex?: number;
      approvalStatus?: "approved" | "pending";
      needsProfileLink?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    memberId?: string;
    memberRole?: "member" | "captain" | "admin";
    handicapIndex?: number;
    approvalStatus?: "approved" | "pending";
    needsProfileLink?: boolean;
  }
}
