import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { query } from "@/lib/db";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL environment variable for NextAuth.");
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable for NextAuth.");
}

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const googleProviderConfigured = Boolean(googleClientId && googleClientSecret);

async function upsertAuthUser(user: { id: string; name?: string | null; email?: string | null; image?: string | null; }) {
  const now = new Date().toISOString();
  const email = user.email || "";
  const name = user.name || email.split("@")[0] || "";
  const image = user.image || "";

  const { rows } = await query(
    `INSERT INTO auth.users (id, email, name, image, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       name = EXCLUDED.name,
       image = EXCLUDED.image,
       updated_at = EXCLUDED.updated_at
     RETURNING *`,
    [user.id, email, name, image, now, now]
  );

  return rows[0];
}

export const authOptions: NextAuthOptions = {
  providers: googleProviderConfigured
    ? [
        GoogleProvider({
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
        }),
      ]
    : [],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session) {
        session.user = {
          ...session.user,
          id: token.sub as string,
          email: token.email as string || null,
          name: token.name as string || null,
          image: token.picture as string || null,
        };
      }
      return session;
    },
    async signIn({ user }) {
      if (!user?.id || !user?.email) return false;
      try {
        await upsertAuthUser({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        });
        return true;
      } catch (err) {
        console.error("SignIn Error:", err);
        return true; // Allow sign in even if DB update fails
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  debug: false,
};
