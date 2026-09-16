"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import ChurchLogo from "@/components/ChurchLogo";
import PrayerRequestForm from "@/components/home/PrayerRequestForm";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { toPhoneHref, toWhatsAppUrl } from "@/lib/admin-labels";

const BOOKING_PHONES = ["01289627399", "01279623454"];

const BANK_ACCOUNTS = [
  { label: "رقم الحساب للجنيه المصرى", value: "9016207" },
  { label: "رقم الحساب لليورو", value: "9023010" },
  { label: "رقم الحساب للدولار الأمريكى", value: "9165133" },
];

const MAP_EMBED_SRC =
  "https://www.google.com/maps?q=30.1260901,31.2977018&hl=ar&z=17&output=embed";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5 },
};

function SectionCard({
  id,
  title,
  delay = 0,
  children,
}: {
  id?: string;
  title: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      className="rounded-3xl border border-coptic-gold-main/40 bg-white/80 p-6 shadow-sm md:p-8"
    >
      <h2 className="text-xl font-bold text-deep-red md:text-2xl">{title}</h2>
      <div className="mt-3 h-1 w-16 rounded-full bg-coptic-gold-main" />
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

export default function ContactPageView() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="text-center"
      >
        <div className="mb-6 flex justify-center">
          <ChurchLogo size={96} className="h-20 w-20" />
        </div>
        <h1 className="bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
          تواصل معنا والخدمات الإلكترونية
        </h1>
        <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-coptic-gold-main" />
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-deep-red/80 md:text-base">
          حجز المواعيد، طلب الصلاة والافتقاد، المساهمات، وعنوان الكنيسة في مكان
          واحد.
        </p>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard id="booking" title="حجز المواعيد" delay={0.05}>
          <p className="text-sm leading-8 text-deep-red/80 md:text-base">
            يمكن حجز مواعيد المناسبات التالية:
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {[
              "أكاليل",
              "خطوبات",
              "معمودية",
              "جنازات",
              "صلاة الثالث",
              "قاعات",
            ].map((item) => (
              <li
                key={item}
                className="inline-flex min-h-11 items-center rounded-full border border-coptic-gold-main/50 bg-coptic-gold-main/10 px-4 text-sm font-bold text-coptic-gold-dark"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm font-bold text-coptic-gold-dark">
            تليفونات الخدام
          </p>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {BOOKING_PHONES.map((number, index) => (
              <motion.li key={number} {...fadeUp} transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}>
                <a
                  href={toPhoneHref(number)}
                  className="flex min-h-11 items-center justify-center rounded-2xl border border-coptic-gold-main/40 bg-cream px-4 py-4 text-lg font-bold tracking-wide text-deep-red transition hover:border-coptic-gold-main"
                  dir="ltr"
                >
                  {number}
                </a>
              </motion.li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard id="prayer-request" title="طلب صلاة أو زيارة افتقاد" delay={0.12}>
          <p className="mb-5 text-sm leading-8 text-deep-red/80">
            اكتب اسمك وطلبك، وسنتواصل معكم أو نصلي من أجلكم.
          </p>
          <PrayerRequestForm />
        </SectionCard>

        <SectionCard id="donations" title="المساهمات والتبرعات" delay={0.08}>
          <blockquote className="space-y-3 rounded-2xl border border-coptic-gold-main/30 bg-cream px-4 py-4 text-center">
            <p className="text-sm font-bold leading-8 text-deep-red">
              «مُشْتَرِكِينَ فِي احْتِيَاجَاتِ الْقِدِّيسِينَ»
              <span className="mt-1 block text-xs font-bold text-coptic-gold-dark">
                (رو 12: 13)
              </span>
            </p>
            <p className="text-sm font-bold leading-8 text-deep-red">
              «فَيَمْلأُ إِلهِي كُلَّ احْتِيَاجِكُمْ بِحَسَبِ غِنَاهُ فِي
              الْمَجْدِ فِي الْمَسِيحِ يَسُوعَ.»
              <span className="mt-1 block text-xs font-bold text-coptic-gold-dark">
                (في 4: 19)
              </span>
            </p>
          </blockquote>
          <p className="mt-5 text-sm leading-8 text-deep-red/80">
            يمكن تقديم المساهمات بسهولة عبر <strong>InstaPay</strong>، أو التحويل
            على حسابات الكنيسة في البنك الأهلى الكويتى - مصر (ABK):
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-coptic-gold-main/40">
            <table className="min-w-full text-right text-sm">
              <tbody>
                <tr className="border-b border-coptic-gold-main/20 bg-cream">
                  <th className="px-4 py-3 font-bold text-deep-red">البنك</th>
                  <td className="px-4 py-3 text-deep-red">
                    البنك الأهلى الكويتى - مصر (ABK)
                  </td>
                </tr>
                {BANK_ACCOUNTS.map((account) => (
                  <tr
                    key={account.value}
                    className="border-t border-coptic-gold-main/20"
                  >
                    <th className="px-4 py-3 font-bold text-deep-red">
                      {account.label}
                    </th>
                    <td
                      className="px-4 py-3 font-bold tracking-wide text-coptic-gold-dark"
                      dir="ltr"
                    >
                      {account.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard id="location" title="العنوان والتواصل" delay={0.16}>
          <div className="grid gap-3 md:grid-cols-2">
            <a
              href={toWhatsAppUrl("01200434061")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-coptic-gold-main/40 bg-cream px-4 py-4 text-sm font-bold text-deep-red transition hover:border-coptic-gold-main"
            >
              <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
              <span>واتساب</span>
              <span dir="ltr">01200434061</span>
            </a>
            <a
              href={toPhoneHref("0222525013")}
              className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-coptic-gold-main/40 bg-cream px-4 py-4 text-sm font-bold text-deep-red transition hover:border-coptic-gold-main"
            >
              <span>تليفون</span>
              <span dir="ltr">0222525013</span>
            </a>
          </div>
          <p className="mt-4 text-sm leading-7 text-deep-red/75">
            كنيسة الشهيد العظيم مارجرجس بالمطرية
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-coptic-gold-main/40">
            <iframe
              title="موقع كنيسة الشهيد العظيم مارجرجس بالمطرية"
              src={MAP_EMBED_SRC}
              className="h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
