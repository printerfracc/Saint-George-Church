import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { authOptions } from "@/lib/auth";

const publicAdminPaths = ["/admin/login", "/admin/join"];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isPublicRoute = publicAdminPaths.some((path) => pathname.startsWith(path));

  if (isPublicRoute) {
    return children;
  }

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/admin/login");
  }

  const isTawze3aRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/servants") ||
    pathname.startsWith("/admin/tawze3a");

  if (session.user.role === "TAWZE3A_ADMIN" && !isTawze3aRoute) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream lg:flex-row">
      <Sidebar
        userName={session.user.name ?? "مسؤول"}
        userRole={session.user.role}
      />
      <div className="min-w-0 flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
