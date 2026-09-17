import { notFound, redirect } from "next/navigation";
import { getServantSession } from "@/lib/servant-session";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "دخول الخدام",
};

export default async function ServantLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishedTawze3a = await prisma.tawze3a.findFirst({
    where: { isPublished: true },
  });

  if (!publishedTawze3a) {
    notFound();
  }

  const session = await getServantSession();

  if (session) {
    redirect("/tawze3a");
  }

  return children;
}
