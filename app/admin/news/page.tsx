import NewsManager from "@/components/admin/NewsManager";
import { listNewsEvents } from "@/actions/admin-actions";
import { parseStoredNewsImageUrls } from "@/lib/news-images";

export const metadata = {
  title: "الأخبار",
};

export default async function AdminNewsPage() {
  let news: Awaited<ReturnType<typeof listNewsEvents>> = [];

  try {
    news = await listNewsEvents();
  } catch {
    news = [];
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <NewsManager
        news={news.map((item) => {
          const imageUrls = parseStoredNewsImageUrls(item.imageUrls, item.imageUrl);

          return {
            id: item.id,
            title: item.title,
            description: item.description,
            imageUrl: imageUrls[0] ?? item.imageUrl,
            imageUrls,
            isActive: item.isActive,
          };
        })}
      />
    </main>
  );
}
