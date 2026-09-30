import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ImportServantsForm from "@/components/admin/ImportServantsForm";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "رفع ملف Excel",
};

export default async function ImportServantsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TAWZE3A_ADMIN") {
    redirect("/admin");
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <AdminPageHeader
        title="رفع ملف Excel"
        description={
          <p className="mt-2 text-sm leading-7 text-deep-red/75">
            ارفع ملف Excel على دفعات. الاسم والرتبة مطلوبان، والموبايل والرقم القومي والخدمة اختياريون.
          </p>
        }
      />
      <ImportServantsForm />
    </main>
  );
}
