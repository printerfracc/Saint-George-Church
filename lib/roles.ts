import type { Role } from "@prisma/client";

export function isTawze3aAuthorizedRole(role?: Role | null) {
  return role === "TAWZE3A_ADMIN";
}

export type InviteAssignableRole = Extract<Role, "ADMIN" | "TAWZE3A_ADMIN">;

export function isInviteAssignableRole(role: string): role is InviteAssignableRole {
  return role === "ADMIN" || role === "TAWZE3A_ADMIN";
}
