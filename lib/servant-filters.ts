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
};

export function parseIdList(value?: string | string[] | null): string[] {
  const raw = Array.isArray(value) ? value.join(",") : (value ?? "");
  return [...new Set(raw.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function serializeIdList(ids: string[]): string {
  return [...new Set(ids.map((item) => item.trim()).filter(Boolean))].join(",");
}

export function parseServantListFilters(params: {
  q?: string | string[] | null;
  role?: string | string[] | null;
  khedma?: string | string[] | null;
  year?: string | string[] | null;
}): ServantQueryFilters {
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const roleIds = parseIdList(params.role);
  const khedmaIds = parseIdList(params.khedma);
  const yearValue = Array.isArray(params.year) ? params.year[0] : params.year;

  return {
    query: query || undefined,
    roleIds,
    khedmaIds,
    year: parseYear(yearValue),
  };
}

export function servantListWhere(
  filters: ServantQueryFilters,
): Prisma.ServantWhereInput | undefined {
  const and: Prisma.ServantWhereInput[] = [];
  const query = filters.query?.trim() ?? "";
  const roleIds = (filters.roleIds ?? []).filter(Boolean);
  const khedmaIds = (filters.khedmaIds ?? []).filter(Boolean);
  const hasRole = roleIds.length > 0;
  const hasKhedma = khedmaIds.length > 0;

  if (query) {
    and.push({
      OR: [{ name: { contains: query } }, { phone: { contains: query } }],
    });
  }

  if (hasKhedma) {
    and.push({
      assignments: { some: { khedmaId: { in: khedmaIds }, year: filters.year } },
    });
  }

  if (hasRole) {
    and.push({
      assignments: { some: { roleId: { in: roleIds }, year: filters.year } },
    });
  }

  return and.length > 0 ? { AND: and } : undefined;
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
  if (assignment.year !== undefined && assignment.year !== filters.year) {
    return false;
  }

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
  },
  selectedRoles: string[],
  selectedKhedmat: string[],
) {
  const matchesKhedma =
    selectedKhedmat.length === 0 ||
    servant.assignments.some((assignment) => selectedKhedmat.includes(assignment.khedmaId ?? ""));

  const matchesRole =
    selectedRoles.length === 0 ||
    servant.assignments.some((assignment) => selectedRoles.includes(assignment.roleId));

  return matchesKhedma && matchesRole;
}

export function uniqueJoin(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].join("، ");
}
