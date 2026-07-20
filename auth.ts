import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      gymId: string | null;
      branchId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    gymId: string | null;
    branchId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    gymId: string | null;
    branchId: string | null;
  }
}

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "development-secret",
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        console.log("========== LOGIN START ==========");

        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        console.log("Email:", email);

        if (!email || !password) {
          console.log("Missing email or password");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            fullName: true,
            email: true,
            password: true,
            role: true,
            gymId: true,
            branchId: true,
            isActive: true,
          },
        });

        console.log("User Found:", !!user);

        if (!user) {
          console.log("User not found");
          return null;
        }

        console.log("Is Active:", user.isActive);

        if (!user.isActive) {
          console.log("User is inactive");
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        console.log("Password Match:", isPasswordValid);

        if (!isPasswordValid) {
          console.log("Password does not match");
          return null;
        }

        console.log("Login Successful");
        console.log("========== LOGIN END ==========");

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          gymId: user.gymId,
          branchId: user.branchId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
        token.gymId = user.gymId ?? null;
        token.branchId = user.branchId ?? null;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as UserRole) ?? "RECEPTIONIST";
        session.user.gymId = token.gymId as string | null;
        session.user.branchId = token.branchId as string | null;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);