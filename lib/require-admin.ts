import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
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

export async function requireTawze3aAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "TAWZE3A_ADMIN") {
    return null;
  }

  return session;
}

export async function requireRegistryAdmin() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session?.user?.id || (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "TAWZE3A_ADMIN")) {
    return null;
  }

  return session;
}
