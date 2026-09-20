import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { verifyAdminCredentials } from "@/server/admin-auth";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8h admin session
  pages: { signIn: "/admin/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const result = await verifyAdminCredentials(parsed.data.email, parsed.data.password);

        if (!result.ok) {
          if (result.reason === "ACCOUNT_LOCKED") throw new Error("ACCOUNT_LOCKED");
          return null;
        }

        return result.user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { role?: string; id?: string }).role =
          token.role as string;
        (session.user as typeof session.user & { role?: string; id?: string }).id =
          token.id as string;
      }
      return session;
    },
  },
});
