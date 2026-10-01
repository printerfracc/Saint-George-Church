import { notFound } from "next/navigation";
import EedContentBanner from "@/components/tawze3a/EedContentBanner";
import ServantLoginForm from "@/components/tawze3a/ServantLoginForm";
import { EED_EL_KHODAM_CONTENT_ID } from "@/lib/eed-content";
import { prisma } from "@/lib/prisma";

export default async function ServantLoginPage() {
  const publishedTawze3a = await prisma.tawze3a.findFirst({
    where: { isPublished: true },
  });

  if (!publishedTawze3a) {
    notFound();
  }

  let banner: { goal: string | null; slogan: string | null } | null = null;

  try {
    banner = await prisma.siteContent.findUnique({
      where: { id: EED_EL_KHODAM_CONTENT_ID },
      select: { goal: true, slogan: true },
    });
  } catch {
    banner = null;
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-28 pb-16">
      <EedContentBanner goal={banner?.goal} slogan={banner?.slogan} compact />
      <ServantLoginForm />
    </div>
  );
}
