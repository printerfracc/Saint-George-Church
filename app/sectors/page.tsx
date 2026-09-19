import ChurchLogo from "@/components/ChurchLogo";
import SectorCard from "@/components/public/SectorCard";
import { listServices } from "@/actions/admin-actions";

export const metadata = {
  title: "قطاعات الخدمات",
};

export const revalidate = 60;

export default async function SectorsPage() {
  let sectors: Awaited<ReturnType<typeof listServices>> = [];

  try {
    sectors = await listServices(null);
  } catch {
    sectors = [];
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-28 pb-16">
      <div className="mb-6 flex justify-center">
        <ChurchLogo size={96} className="h-20 w-20" />
      </div>
      <h1 className="bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark bg-clip-text text-center text-3xl font-bold text-transparent md:text-4xl">
        قطاعات الخدمات
      </h1>
      <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-coptic-gold-main" />
      <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-8 text-deep-red/80 md:text-base">
        خدمات الكنيسة في القطاعات المختلفة، كما تُنشر من إدارة الموقع.
      </p>

      {sectors.length === 0 ? (
        <p
          id="sectors"
          className="mt-10 rounded-2xl border border-dashed border-coptic-gold-main/50 bg-white/70 px-4 py-10 text-center text-deep-red/70"
        >
          سيتم نشر قطاعات الخدمات قريباً.
        </p>
      ) : (
        <ul
          id="sectors"
          className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {sectors.map((sector) => (
            <li key={sector.id}>
              <SectorCard
                id={sector.id}
                title={sector.title}
                imageUrl={sector.imageUrl}
                childCount={sector.childCount}
                imageDisplayMode={sector.imageDisplayMode}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
