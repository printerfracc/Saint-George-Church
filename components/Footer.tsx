import Image from "next/image";
import Link from "next/link";
import ChurchLogo from "@/components/ChurchLogo";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import {
  CHURCH_DESCRIPTION,
  CHURCH_NAME,
  FRACC_FACEBOOK,
  FRACC_LOGO,
  FRACC_NAME,
  FRACC_WHATSAPP,
} from "@/lib/church";
import { toWhatsAppUrl } from "@/lib/admin-labels";

const mainLinks = [
  
  { href: "/", label: "الرئيسية" },
  { href: "/liturgies", label: "صلوات الكنيسة" },
  { href: "/sectors", label: "قطاعات الخدمات" },
  { href: "/media", label: "الوسائط والمكتبة" },
  { href: "/contact", label: "تواصل معنا" },
] as const;

const extraLinks = [
  { href: "/history", label: "قصة الكنيسة" },
  { href: "/priests", label: "الآباء الكهنة" },
  { href: "/prayers", label: "جدول القداسات" },
  { href: "/live", label: "البث المباشر" },
  { href: "/sermons", label: "مكتبة العظات" },
  { href: "/prayer-requests", label: "طلب صلاة" },
] as const;

function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.2h2.4l.36-2.8H13.5V9.2c0-.8.22-1.35 1.38-1.35H16.4V5.35C16.06 5.3 15.1 5.2 14 5.2c-2.3 0-3.88 1.4-3.88 4v1.8H7.8v2.8h2.32V21H13.5Z" />
    </svg>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-coptic-gold-main/30 bg-[#1A0A10] text-cream">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:px-6 lg:grid-cols-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="overflow-hidden rounded-md bg-cream">
              <ChurchLogo size={56} className="h-14 w-14" />
            </span>
            <span className="text-sm font-bold leading-6 text-coptic-gold-light">
              {CHURCH_NAME}
            </span>
          </Link>
          <p className="mt-4 text-sm leading-7 text-cream/70">{CHURCH_DESCRIPTION}</p>
        </div>

        <nav aria-label="روابط الموقع">
          <h2 className="text-sm font-bold text-coptic-gold-main">روابط الموقع</h2>
          <div className="mt-3 h-0.5 w-10 rounded-full bg-coptic-gold-main" />
          <ul className="mt-4 space-y-2">
            {mainLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-sm text-cream/80 transition-colors hover:text-coptic-gold-light"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="صفحات مهمة">
          <h2 className="text-sm font-bold text-coptic-gold-main">صفحات مهمة</h2>
          <div className="mt-3 h-0.5 w-10 rounded-full bg-coptic-gold-main" />
          <ul className="mt-4 space-y-2">
            {extraLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-sm text-cream/80 transition-colors hover:text-coptic-gold-light"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-bold text-coptic-gold-main">تطوير الموقع</h2>
          <div className="mt-3 h-0.5 w-10 rounded-full bg-coptic-gold-main" />
          <div className="mt-4 flex items-center gap-3">
            <Image
              src={FRACC_LOGO}
              alt={FRACC_NAME}
              width={64}
              height={64}
              className="h-16 w-16 rounded-xl bg-cream object-contain p-1"
            />
            <p className="text-sm font-bold leading-6 text-coptic-gold-light">
              {FRACC_NAME}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <a
              href={FRACC_FACEBOOK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-coptic-gold-main/50 text-coptic-gold-light transition-colors hover:bg-coptic-gold-main hover:text-[#1A0A10]"
              aria-label="صفحة فيسبوك مركز ابونا اندراوس"
            >
              <FacebookIcon className="h-5 w-5" />
            </a>
            <a
              href={toWhatsAppUrl(FRACC_WHATSAPP)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:opacity-90"
              aria-label="واتساب مركز ابونا اندراوس"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-coptic-gold-main/20">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs leading-6 text-cream/65 md:px-6">
          جميع الحقوق محفوظة © {year} {FRACC_NAME}
        </p>
      </div>
    </footer>
  );
}
