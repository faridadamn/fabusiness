import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appUsers } from "@/db/schema";

const providers = [];

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const email = user.email.toLowerCase();
      const displayName = user.name?.trim() || email.split("@")[0] || "User";

      const existing = await db
        .select({ id: appUsers.id })
        .from(appUsers)
        .where(eq(appUsers.email, email))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(appUsers).values({ email, displayName });
      } else {
        await db
          .update(appUsers)
          .set({ displayName, updatedAt: new Date(), deletedAt: null })
          .where(eq(appUsers.email, email));
      }

      return true;
    },
    async jwt({ token }) {
      if (!token.email) return token;

      const [record] = await db
        .select({ id: appUsers.id })
        .from(appUsers)
        .where(eq(appUsers.email, token.email.toLowerCase()))
        .limit(1);

      if (record) token.userId = record.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
