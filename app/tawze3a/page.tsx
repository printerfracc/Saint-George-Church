import { notFound, redirect } from "next/navigation";
import Tawze3aViewer, {
  type MyAssignment,
  type PublicTawze3a,
} from "@/components/tawze3a/Tawze3aViewer";
import { prisma } from "@/lib/prisma";
import { getServantSession } from "@/lib/servant-session";

export const metadata = {
  title: "توزيعة الخدام",
};

async function getPublishedTawze3a() {
  return prisma.tawze3a.findFirst({
    where: { isPublished: true },
    include: {
      khedmat: {
        include: {
          categories: {
            include: {
              role: true,
              assignments: {
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

  const fullTawze3a = await getPublishedTawze3a();

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

  try {
    myAssignmentsRaw = await prisma.servantAssignment.findMany({
      where: {
        servantId: session.servantId,
        category: { khedma: { tawze3aId: fullTawze3a.id } },
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

  const myAssignments: MyAssignment[] = myAssignmentsRaw.map((assignment) => ({
    id: assignment.id,
    categoryLabel: assignment.category.label,
    roleName: assignment.role?.name ?? assignment.category.role?.name ?? assignment.category.label,
    khedmaId: assignment.category.khedma.id,
    khedmaName: assignment.category.khedma.name,
  }));

  return (
    <Tawze3aViewer
      publishedTawze3a={viewerTawze3a}
      servantName={session.name}
      myAssignments={myAssignments}
      servantId={session.servantId}
    />
  );
}
