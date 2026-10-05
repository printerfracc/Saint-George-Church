import { notFound, redirect } from "next/navigation";
import Tawze3aViewer, {
  type HistoryAssignment,
  type MyAssignment,
  type PublicTawze3a,
} from "@/components/tawze3a/Tawze3aViewer";
import { prisma } from "@/lib/prisma";
import { assignedKhedmaFilter, publishedAssignmentWhere } from "@/lib/servant-filters";
import { getServantSession } from "@/lib/servant-session";
import { getEedSiteContent } from "@/lib/eed-content";
import { getCurrentActiveYear } from "@/lib/tawze3a-year";

export const metadata = {
  title: "عيد الخدام",
};

async function getPublishedTawze3a(currentActiveYear: number) {
  return prisma.tawze3a.findFirst({
    where: { isPublished: true },
    include: {
      khedmat: {
        include: {
          categories: {
            include: {
              role: true,
              assignments: {
                where: publishedAssignmentWhere(currentActiveYear),
                include: {
                  servant: true,
                  role: true,
                },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
}

export default async function Tawze3aPage() {
  const publishedTawze3a = await prisma.tawze3a.findFirst({
    where: { isPublished: true },
  });

  if (!publishedTawze3a) {
    notFound();
  }

  const session = await getServantSession();

  if (!session) {
    redirect("/tawze3a/login");
  }

  const servant = await prisma.servant.findUnique({
    where: { id: session.servantId },
    select: { id: true, name: true },
  });

  if (!servant) {
    redirect("/tawze3a/clear-session");
  }

  const currentActiveYear = await getCurrentActiveYear();
  const [fullTawze3a, khedmaAssignmentCount] = await Promise.all([
    getPublishedTawze3a(currentActiveYear),
    prisma.servantAssignment.count({
      where: {
        servantId: servant.id,
        year: currentActiveYear,
        khedmaId: { not: null },
      },
    }),
  ]);

  if (!fullTawze3a) {
    notFound();
  }

  let myAssignmentsRaw: Awaited<
    ReturnType<
      typeof prisma.servantAssignment.findMany<{
        include: {
          role: true;
          category: { include: { khedma: true; role: true } };
        };
      }>
    >
  > = [];
  let historyRaw: Awaited<
    ReturnType<
      typeof prisma.servantAssignment.findMany<{
        include: {
          role: true;
          khedma: true;
          category: { include: { khedma: true; role: true } };
        };
      }>
    >
  > = [];

  try {
    myAssignmentsRaw = await prisma.servantAssignment.findMany({
      where: {
        servantId: session.servantId,
        year: currentActiveYear,
        isDraft: false,
        AND: [assignedKhedmaFilter, { category: { khedma: { tawze3aId: fullTawze3a.id } } }],
      },
      include: {
        role: true,
        category: {
          include: { khedma: true, role: true },
        },
      },
    });
  } catch {
    myAssignmentsRaw = [];
  }

  try {
    historyRaw = await prisma.servantAssignment.findMany({
      where: { servantId: session.servantId, isDraft: false },
      orderBy: { year: "desc" },
      include: {
        role: true,
        khedma: true,
        category: {
          include: { khedma: true, role: true },
        },
      },
    });
  } catch {
    historyRaw = [];
  }

  const viewerTawze3a: PublicTawze3a = {
    id: fullTawze3a.id,
    title: fullTawze3a.title,
    khedmat: fullTawze3a.khedmat.map((khedma) => ({
      id: khedma.id,
      name: khedma.name,
      order: khedma.order,
      categories: [...khedma.categories]
        .sort((left, right) => left.order - right.order)
        .map((category) => ({
          id: category.id,
          label: category.label,
          roleName: category.role?.name ?? category.label,
          order: category.order,
          assignments: category.assignments.map((assignment) => ({
            id: assignment.id,
            servantId: assignment.servantId,
            servant: {
              id: assignment.servant.id,
              name: assignment.servant.name,
            },
          })),
        })),
    })),
  };

  const history: HistoryAssignment[] = historyRaw.flatMap((assignment) => {
    const khedmaName = assignment.khedma?.name ?? assignment.category?.khedma.name ?? "";
    const roleName =
      assignment.role?.name ?? assignment.category?.role?.name ?? assignment.category?.label ?? "";

    if (!khedmaName) {
      return [];
    }

    return [
      {
        id: assignment.id,
        year: assignment.year,
        roleName,
        khedmaName,
      },
    ];
  });

  const myAssignments: MyAssignment[] = myAssignmentsRaw.flatMap((assignment) => {
    if (!assignment.category) {
      return [];
    }

    return [
      {
        id: assignment.id,
        categoryLabel: assignment.category.label,
        roleName: assignment.role?.name ?? assignment.category.role?.name ?? assignment.category.label,
        khedmaId: assignment.category.khedma.id,
        khedmaName: assignment.category.khedma.name,
      },
    ];
  });

  const banner = await getEedSiteContent();

  return (
    <Tawze3aViewer
      publishedTawze3a={viewerTawze3a}
      servantName={servant.name}
      unassigned={khedmaAssignmentCount === 0}
      myAssignments={myAssignments}
      history={history}
      activeYear={currentActiveYear}
      servantId={session.servantId}
      banner={banner}
    />
  );
}
