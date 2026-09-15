import NewsManager from "@/components/admin/NewsManager";
import { listNewsEvents } from "@/actions/admin-actions";

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
        news={news.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          imageUrl: item.imageUrl,
          isActive: item.isActive,
        }))}
      />
    </main>
  );
}
