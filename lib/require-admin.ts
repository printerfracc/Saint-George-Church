import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return session;
}

export async function requireSuperAdmin() {
  const session = await requireAdmin();

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return null;
  }

  return session;
}
