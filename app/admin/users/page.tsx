import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "إدارة الحسابات",
};

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  let users: Awaited<
    ReturnType<
      typeof prisma.user.findMany<{
        select: { id: true; name: true; email: true; role: true };
      }>
    >
  > = [];

  try {
    users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  } catch {
    users = [];
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <AdminPageHeader
        title="إدارة الحسابات"
        description={
          <p className="mt-2 text-sm leading-7 text-deep-red/75">
            عرض حسابات المسؤولين وحذف الحسابات غير المرغوب فيها. لا يمكنك حذف حسابك الشخصي.
          </p>
        }
      />
      <AdminUsersTable users={users} currentUserId={session.user.id} />
    </main>
  );
}
