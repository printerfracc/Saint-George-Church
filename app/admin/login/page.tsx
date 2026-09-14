import AdminLoginForm from "@/components/admin/AdminLoginForm";
import ChurchLogo from "@/components/ChurchLogo";
import { CHURCH_NAME } from "@/lib/church";

export const metadata = {
  title: "تسجيل دخول المسؤول",
};

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <section className="rounded-2xl border border-coptic-gold-main/50 bg-white/85 p-6 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <ChurchLogo size={96} className="h-20 w-20" />
        </div>
        <p className="mb-4 text-sm font-bold text-coptic-gold-dark">
          {CHURCH_NAME}
        </p>
        <h1 className="bg-linear-to-r from-coptic-gold-dark to-coptic-gold-main bg-clip-text text-2xl font-bold text-transparent">
          تسجيل دخول المسؤول
        </h1>
        <div className="mx-auto mt-3 w-16 border-b-4 border-coptic-gold-main" />
        <p className="mt-4 text-sm leading-7 text-coptic-gold-dark/80">
          أدخل بيانات الحساب للوصول إلى لوحة التحكم.
        </p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
