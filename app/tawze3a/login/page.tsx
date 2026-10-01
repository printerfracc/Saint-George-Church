import { notFound } from "next/navigation";
import EedContentBanner from "@/components/tawze3a/EedContentBanner";
import ServantLoginForm from "@/components/tawze3a/ServantLoginForm";
import { getEedSiteContent } from "@/lib/eed-content";
import { prisma } from "@/lib/prisma";

export default async function ServantLoginPage() {
  const publishedTawze3a = await prisma.tawze3a.findFirst({
    where: { isPublished: true },
  });

  if (!publishedTawze3a) {
    notFound();
  }

  const banner = await getEedSiteContent();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-28 pb-16">
      <EedContentBanner
        goal={banner?.goal}
        slogan={banner?.slogan}
        sloganLogo={banner?.sloganLogo}
      />
      <ServantLoginForm />
    </div>
  );
}
