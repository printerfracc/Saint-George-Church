import type { Role } from "@prisma/client";

export function isTawze3aAuthorizedRole(role?: Role | null) {
  return role === "TAWZE3A_ADMIN";
}

export type InviteAssignableRole = Extract<Role, "ADMIN" | "TAWZE3A_ADMIN" | "MONASBAT_ADMIN">;

export function isInviteAssignableRole(role: string): role is InviteAssignableRole {
  return role === "ADMIN" || role === "TAWZE3A_ADMIN" || role === "MONASBAT_ADMIN";
}

export function isMonasbatAdminRoute(pathname: string) {
  return pathname.startsWith("/admin/registry") || pathname.startsWith("/admin/anniversaries");
}
