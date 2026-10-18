import { Prisma } from "@prisma/client";
import { parseYear } from "@/lib/assignment-year";

export const assignedKhedmaFilter: Prisma.ServantAssignmentWhereInput = {
  OR: [{ khedmaId: { not: null } }, { categoryId: { not: null } }],
};

export function publishedAssignmentWhere(year: number): Prisma.ServantAssignmentWhereInput {
  return {
    year,
    isDraft: false,
    AND: [assignedKhedmaFilter],
  };
}

export type ServantQueryFilters = {
  query?: string;
  roleIds: string[];
  khedmaIds: string[];
  year: number;
  assignedToOtherKhedma?: boolean;
  statusRoleIds?: string[];
  bloodType?: string;
  deaconRank?: string;
};

export function parseIdList(value?: string | string[] | null): string[] {
  const raw = Array.isArray(value) ? value.join(",") : (value ?? "");
  return [...new Set(raw.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function serializeIdList(ids: string[]): string {
  return [...new Set(ids.map((item) => item.trim()).filter(Boolean))].join(",");
}

function firstText(value?: string | string[] | null) {
  const raw = Array.isArray(value) ? value[0] : value;
  const text = raw?.trim() ?? "";
  return text || undefined;
}

export function parseServantListFilters(params: {
  q?: string | string[] | null;
  role?: string | string[] | null;
  khedma?: string | string[] | null;
  year?: string | string[] | null;
  other?: string | string[] | null;
  blood?: string | string[] | null;
  rank?: string | string[] | null;
}): ServantQueryFilters {
  const query = firstText(params.q) ?? "";
  const roleIds = parseIdList(params.role);
  const khedmaIds = parseIdList(params.khedma);
  const yearValue = Array.isArray(params.year) ? params.year[0] : params.year;
  const otherValue = Array.isArray(params.other) ? params.other[0] : params.other;

  return {
    query: query || undefined,
    roleIds,
    khedmaIds,
    year: parseYear(yearValue),
    assignedToOtherKhedma: otherValue === "1",
    bloodType: firstText(params.blood),
    deaconRank: firstText(params.rank),
  };
}

export function servantListWhere(
  filters: ServantQueryFilters,
): Prisma.ServantWhereInput | undefined {
  const and: Prisma.ServantWhereInput[] = [];
  const roleIds = (filters.roleIds ?? []).filter(Boolean);
  const khedmaIds = (filters.khedmaIds ?? []).filter(Boolean);
  const hasRole = roleIds.length > 0;
  const hasKhedma = khedmaIds.length > 0;

  if (hasKhedma) {
    and.push({
      assignments: { some: { khedmaId: { in: khedmaIds } } },
    });
  }

  if (hasRole) {
    and.push({
      assignments: { some: { roleId: { in: roleIds } } },
    });
  }

  if (filters.bloodType) {
    and.push({ bloodType: filters.bloodType });
  }

  if (filters.deaconRank) {
    and.push({ deaconRank: filters.deaconRank });
  }

  if (filters.assignedToOtherKhedma) {
    const statusRoleIds = filters.statusRoleIds ?? [];

    if (statusRoleIds.length === 0) {
      and.push({ id: { in: [] } });
    } else {
      and.push({
        assignments: {
          some: {
            year: filters.year,
            roleId: { in: statusRoleIds },
            khedmaId: null,
          },
        },
      });
      and.push({
        assignments: {
          some: {
            year: filters.year,
            khedmaId: { not: null },
          },
        },
      });
    }
  }

  return and.length > 0 ? { AND: and } : undefined;
}

export function servantMatchesSearchQuery(
  servant: {
    name: string;
    phone?: string | null;
    nationalId?: string | null;
  },
  query?: string | null,
) {
  const searchQuery = query?.trim() ?? "";

  if (!searchQuery) {
    return true;
  }

  const matchesName = servant.name.includes(searchQuery);
  const matchesPhone = servant.phone?.includes(searchQuery) ?? false;
  const matchesId = servant.nationalId?.includes(searchQuery) ?? false;

  return matchesName || matchesPhone || matchesId;
}

export function assignmentMatchesFilters(
  assignment: {
    roleId: string;
    khedmaId?: string | null;
    year?: number;
    category?: { khedmaId: string } | null;
  },
  filters: ServantQueryFilters,
) {
  const assignmentKhedmaId = assignment.khedmaId ?? assignment.category?.khedmaId ?? "";

  if (filters.khedmaIds.length > 0 && !filters.khedmaIds.includes(assignmentKhedmaId)) {
    return false;
  }

  if (filters.roleIds.length > 0 && !filters.roleIds.includes(assignment.roleId)) {
    return false;
  }

  return true;
}

export function servantMatchesFilters(
  servant: {
    assignments: Array<{ roleId: string; khedmaId?: string | null }>;
    bloodType?: string | null;
    deaconRank?: string | null;
  },
  selectedRoles: string[],
  selectedKhedmat: string[],
  bloodType?: string,
  deaconRank?: string,
) {
  const matchesKhedma =
    selectedKhedmat.length === 0 ||
    servant.assignments.some((assignment) => selectedKhedmat.includes(assignment.khedmaId ?? ""));

  const matchesRole =
    selectedRoles.length === 0 ||
    servant.assignments.some((assignment) => selectedRoles.includes(assignment.roleId));

  const matchesBlood = !bloodType || servant.bloodType === bloodType;
  const matchesRank = !deaconRank || servant.deaconRank === deaconRank;

  return matchesKhedma && matchesRole && matchesBlood && matchesRank;
}

export function uniqueJoin(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].join("، ");
}
