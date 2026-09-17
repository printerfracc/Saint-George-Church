import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Tawze3aListManager from "@/components/admin/Tawze3aListManager";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { listTawze3at } from "@/actions/tawze3a-admin";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "إدارة التوزيعة",
};

export default async function AdminTawze3aPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TAWZE3A_ADMIN") {
    redirect("/admin");
  }

  const items = await listTawze3at();

  return (
    <main className="px-4 py-8 md:px-8">
      <AdminPageHeader
        title="إدارة التوزيعة"
        description={
          <p className="mt-2 text-sm leading-7 text-deep-red/75">
            اعمل التوزيعة وعدّل الخدمات من هنا.
          </p>
        }
      />
      <Tawze3aListManager items={items} />
    </main>
  );
}
