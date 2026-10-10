import { notFound, redirect } from "next/navigation";
import EedContentBanner from "@/components/tawze3a/EedContentBanner";
import ServantLoginForm from "@/components/tawze3a/ServantLoginForm";
import { getEedSiteContent } from "@/lib/eed-content";
import { prisma } from "@/lib/prisma";
import { getServantSession, servantNextPath } from "@/lib/servant-session";

export default async function ServantLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const publishedTawze3a = await prisma.tawze3a.findFirst({
    where: { isPublished: true },
  });

  if (!publishedTawze3a) {
    notFound();
  }

  const { next } = await searchParams;
  const nextPath = servantNextPath(next);
  const session = await getServantSession();

  if (session) {
    redirect(nextPath);
  }

  const banner = await getEedSiteContent();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-28 pb-16">
      <EedContentBanner
        goal={banner?.goal}
        slogan={banner?.slogan}
        sloganLogo={banner?.sloganLogo}
      />
      <ServantLoginForm nextPath={nextPath} />
    </div>
  );
}
