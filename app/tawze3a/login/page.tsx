import { notFound } from "next/navigation";
import ServantLoginForm from "@/components/tawze3a/ServantLoginForm";
import { prisma } from "@/lib/prisma";

export default async function ServantLoginPage() {
  const publishedTawze3a = await prisma.tawze3a.findFirst({
    where: { isPublished: true },
  });

  if (!publishedTawze3a) {
    notFound();
  }

  return <ServantLoginForm />;
}
