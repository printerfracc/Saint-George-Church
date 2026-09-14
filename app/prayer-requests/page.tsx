import PrayerRequestForm from "@/components/home/PrayerRequestForm";

export const metadata = {
  title: "طلبات الصلاة",
};

export default function PrayerRequestsPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-28 pb-12">
      <h1 className="text-3xl font-bold text-deep-red">طلبات الصلاة</h1>
      <div className="mt-3 h-1 w-20 rounded-full bg-gold" />
      <p className="mt-4 text-sm leading-8 text-deep-red/75">
        اكتب اسمك وطلبك، وسنصلي من أجلكم في الكنيسة.
      </p>
      <div className="mt-8">
        <PrayerRequestForm />
      </div>
    </main>
  );
}
