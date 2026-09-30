export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ServantDirectory, { type ServantRow } from "@/components/admin/ServantDirectory";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { getServants, listKhedmaFilters } from "@/actions/servants-crud";
import { listServantRoles } from "@/actions/tawze3a-admin";
import { authOptions } from "@/lib/auth";
import { parseServantListFilters } from "@/lib/servant-filters";
import { listAssignmentYears } from "@/lib/tawze3a-year";

export const metadata = {
  title: "إدارة الخدام",
};

export default async function ServantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; khedma?: string; year?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TAWZE3A_ADMIN") {
    redirect("/admin");
  }

  const params = await searchParams;
  const filters = parseServantListFilters(params);
  const query = filters.query ?? "";
  const roleIds = filters.roleIds;
  const khedmaIds = filters.khedmaIds;

  const [result, khedmat, roles, years] = await Promise.all([
    getServants(query, 1, 100, {
      roleIds,
      khedmaIds,
      year: filters.year,
    }),
    listKhedmaFilters(),
    listServantRoles(),
    listAssignmentYears(),
  ]);

  const servants: ServantRow[] =
    "success" in result
      ? result.servants.map((servant) => ({
          ...servant,
          createdAt: servant.createdAt.toISOString(),
        }))
      : [];

  return (
    <main className="px-4 py-8 md:px-8">
      <AdminPageHeader
        title="إدارة الخدام"
        description={
          <p className="mt-2 text-sm leading-7 text-deep-red/75">
            ضيف خدام، عدّل البيانات، أو ارفع Excel. الموبايل والرقم القومي والخدمة اختيارية، ويمكنك التصفية بالرتبة.
          </p>
        }
      />
      <ServantDirectory
        initialServants={servants}
        initialTotal={"success" in result ? result.total : 0}
        khedmat={khedmat.map((item) => ({
          id: item.id,
          name: item.name,
          tawze3aTitle: item.tawze3a.title,
        }))}
        roles={roles}
        query={query}
        roleIds={roleIds}
        khedmaIds={khedmaIds}
        years={years}
        selectedYear={filters.year}
      />
    </main>
  );
}
