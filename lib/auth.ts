import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { describeAuthId, findUserByIdOrEmail } from "@/lib/session-user";

function pickJwtUserId(token: JWT) {
  const candidates = [token.userId, token.sub, token.id].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  const cuidLike = candidates.find(
    (value) => /^c[a-z0-9]{20,32}$/i.test(value) && !value.includes("-"),
  );

  if (cuidLike) {
    return cuidLike;
  }

  return candidates.find((value) => !value.includes("@")) ?? candidates[0] ?? "";
}

function applyUserToToken(
  token: JWT,
  user: { id: string; email: string; role: JWT["role"] },
) {
  token.sub = user.id;
  token.id = user.id;
  token.userId = user.id;
  token.role = user.role;
  token.email = user.email;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "بيانات الدخول",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password;

        if (!email || !password) {
          throw new Error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
        }

        let user;

        try {
          user = await prisma.user.findUnique({
            where: { email },
          });
        } catch {
          throw new Error("تعذر تسجيل الدخول حالياً. حاول مرة أخرى.");
        }

        if (!user) {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }

        const isValidPassword = await compare(password, user.password);

        if (!isValidPassword) {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        applyUserToToken(token, user);
        console.info("[auth] jwt:signin", {
          ...describeAuthId(user.id),
          hasEmail: Boolean(user.email),
          role: user.role,
        });
        return token;
      }

      const persistedId = pickJwtUserId(token);
      const tokenEmail = typeof token.email === "string" ? token.email : "";

      try {
        const dbUser = await findUserByIdOrEmail(persistedId, tokenEmail);

        if (dbUser) {
          applyUserToToken(token, dbUser);
        }
      } catch (error) {
        console.error("[auth] jwt: refresh from database failed", error);
      }

      return token;
    },
    async session({ session, token }) {
      const userId = pickJwtUserId(token);

      if (session.user) {
        session.user.id = userId;
        session.user.role = token.role;
        if (typeof token.email === "string" && token.email) {
          session.user.email = token.email;
        }
      }

      return session;
    },
  },
};
