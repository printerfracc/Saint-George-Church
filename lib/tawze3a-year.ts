import { prisma } from "@/lib/prisma";
import { calendarYear, parseYear } from "@/lib/assignment-year";

export { calendarYear, parseYear };

export async function getCurrentActiveYear() {
  const latest = await prisma.servantAssignment.findFirst({
    where: { isDraft: false },
    orderBy: { year: "desc" },
    select: { year: true },
  });

  return latest?.year ?? calendarYear();
}

export async function listAssignmentYears() {
  const rows = await prisma.servantAssignment.findMany({
    distinct: ["year"],
    select: { year: true },
    orderBy: { year: "desc" },
  });

  const years = new Set(rows.map((row) => row.year));
  const current = calendarYear();
  years.add(current);
  years.add(current + 1);

  return [...years].sort((left, right) => right - left);
}
