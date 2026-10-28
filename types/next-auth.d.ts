import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

/** Valid session roles: SUPER_ADMIN, ADMIN, TAWZE3A_ADMIN, MONASBAT_ADMIN */
type SessionRole = Role;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: SessionRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: SessionRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userId?: string;
    role: SessionRole;
  }
}
