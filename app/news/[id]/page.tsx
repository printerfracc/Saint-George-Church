export const dynamic = "force-dynamic";

import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ChurchLogo from "@/components/ChurchLogo";
import NewsImageRotator from "@/components/public/NewsImageRotator";
import { formatAdminDate } from "@/lib/admin-labels";
import { ensureNewsImageColumn } from "@/lib/ensure-news-column";
import { parseStoredNewsImageUrls } from "@/lib/news-images";
import { prisma } from "@/lib/prisma";
import { recordPageMetadata } from "@/lib/seo";

const getPublicNews = cache(async (id: string) => {
  try {
    await ensureNewsImageColumn();
    const news = await prisma.newsEvent.findUnique({ where: { id } });

    if (!news?.isActive) {
      return null;
    }

    return news;
  } catch (error) {
    console.error("Failed to load news item", error);
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const news = await getPublicNews(id);

  return recordPageMetadata({
    title: news?.title,
    description: news?.description,
    imageUrl: news?.imageUrl,
    fallbackTitle: "أخبار الكنيسة",
    path: `/news/${id}`,
  });
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const news = await getPublicNews(id);

  if (!news) {
    notFound();
  }

  const title = news.title.trim() || "خبر";
  const description = news.description.trim();
  const images = parseStoredNewsImageUrls(news.imageUrls, news.imageUrl);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-28 pb-16">
      <div className="mb-6 flex justify-center">
        <ChurchLogo size={96} className="h-20 w-20" />
      </div>
      <p className="text-center">
        <Link href="/#news" className="text-sm font-bold text-coptic-gold-dark">
          أخبار الكنيسة
        </Link>
      </p>
      <h1 className="mt-3 bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark bg-clip-text text-center text-3xl font-bold text-transparent md:text-4xl">
        {title}
      </h1>
      <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-coptic-gold-main" />
      <p className="mt-4 text-center">
        <time dateTime={news.createdAt.toISOString()} className="text-xs font-bold text-coptic-gold-main">
          {formatAdminDate(news.createdAt)}
        </time>
      </p>

      <article className="mx-auto mt-8 overflow-hidden rounded-2xl border border-coptic-gold-main/40 bg-white/80 shadow-sm">
        <NewsImageRotator
          images={images}
          alt={title}
          frameClassName="relative aspect-video w-full overflow-hidden bg-cream"
        />
        <div className="p-6 md:p-8">
          {description ? (
            <p className="whitespace-pre-line text-sm leading-8 text-deep-red/85 md:text-base">
              {description}
            </p>
          ) : (
            <p className="text-center text-sm text-deep-red/70">لا توجد تفاصيل منشورة لهذا الخبر بعد.</p>
          )}
        </div>
      </article>
    </main>
  );
}
