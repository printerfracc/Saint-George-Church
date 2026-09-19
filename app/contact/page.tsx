import ContactPageView from "@/components/public/ContactPageView";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata(
  "تواصل معنا والخدمات الإلكترونية",
  "تواصل مع كنيسة الشهيد العظيم مارجرجس بالمطرية، واطلب الخدمات الإلكترونية أو أرسل استفسارك للكنيسة.",
);

export default function ContactPage() {
  return <ContactPageView />;
}
