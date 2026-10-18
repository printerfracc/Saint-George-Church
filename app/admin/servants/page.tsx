export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ServantDirectory, { type ServantRow } from "@/components/admin/ServantDirectory";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { getServants, listKhedmaFilters, listServantFieldOptions } from "@/actions/servants-crud";
import { listServantRoles } from "@/actions/tawze3a-admin";
import { authOptions } from "@/lib/auth";
import { parseServantListFilters } from "@/lib/servant-filters";
import { OTHER_KHEDMA_STATUS_ROLES } from "@/lib/servant-import-schema";
import { getCurrentActiveYear } from "@/lib/tawze3a-year";

export const metadata = {
  title: "إدارة الخدام",
};

export default async function ServantsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    khedma?: string;
    year?: string;
    other?: string;
    blood?: string;
    rank?: string;
  }>;
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
  const activeYear = await getCurrentActiveYear();

  const [result, khedmat, roles, fieldOptions] = await Promise.all([
    getServants(query, 1, 100, {
      roleIds,
      khedmaIds,
      year: activeYear,
      assignedToOtherKhedma: filters.assignedToOtherKhedma,
      bloodType: filters.bloodType,
      deaconRank: filters.deaconRank,
    }),
    listKhedmaFilters(),
    listServantRoles(),
    listServantFieldOptions(),
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
            ضيف خدام، عدّل البيانات، أو ارفع Excel. الموبايل والرقم القومي والخدمة اختيارية، ويمكنك التصفية بالرتبة وفصيلة الدم والرتبة الشماسية.
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
        bloodType={filters.bloodType ?? ""}
        deaconRank={filters.deaconRank ?? ""}
        bloodTypes={fieldOptions.bloodTypes}
        deaconRanks={fieldOptions.deaconRanks}
        selectedYear={activeYear}
        assignedToOtherKhedma={
          Boolean(filters.assignedToOtherKhedma) &&
          roles.some(
            (role) =>
              roleIds.includes(role.id) &&
              OTHER_KHEDMA_STATUS_ROLES.some((status) => status.name === role.name),
          )
        }
      />
    </main>
  );
}
