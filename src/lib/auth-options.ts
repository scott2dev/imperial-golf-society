import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import {
  getMemberRecordByEmail,
  isEmailAllowedToSignIn,
  syncLinkedMemberProfile,
} from "@/lib/member-store";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.trim().toLowerCase();

      if (!email || !isEmailAllowedToSignIn(email)) {
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      const email = (user?.email ?? token.email)?.trim().toLowerCase();

      if (!email) {
        return token;
      }

      token.email = email;

      const shouldRefreshMember =
        Boolean(user) || !token.memberId || token.approvalStatus !== "approved";

      if (!shouldRefreshMember) {
        return token;
      }

      const memberRecord = user
        ? await syncLinkedMemberProfile({
            email,
            image: user.image,
          })
        : await getMemberRecordByEmail(email);

      if (!memberRecord) {
        token.memberId = undefined;
        token.memberRole = undefined;
        token.handicapIndex = undefined;
        token.approvalStatus = undefined;
        token.needsProfileLink = true;
        return token;
      }

      token.memberId = memberRecord.id;
      token.memberRole = memberRecord.role;
      token.handicapIndex = memberRecord.handicapIndex;
      token.approvalStatus = memberRecord.approvalStatus;
      token.needsProfileLink = false;

      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.memberId = token.memberId;
      session.user.role = token.memberRole;
      session.user.handicapIndex = token.handicapIndex;
      session.user.approvalStatus = token.approvalStatus;
      session.user.needsProfileLink = token.needsProfileLink ?? false;

      return session;
    },
  },
};
