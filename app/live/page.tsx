import ChurchLogo from "@/components/ChurchLogo";
import ChurchLiveStream from "@/components/live/ChurchLiveStream";

export const revalidate = 60;

export const metadata = {
  title: "البث المباشر",
};

export default function LivePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-28 pb-16">
      <div className="mb-6 flex justify-center">
        <ChurchLogo size={96} className="h-20 w-20" />
      </div>
      <h1 className="bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark bg-clip-text text-center text-3xl font-bold text-transparent md:text-4xl">
        البث المباشر
      </h1>
      <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-coptic-gold-main" />
      <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-8 text-deep-red/80 md:text-base">
        شاهد القداس والصلوات مباشرة من الكنيسة، أو تابع قناة الكنيسة على يوتيوب.
      </p>
      <ChurchLiveStream />
    </main>
  );
}
