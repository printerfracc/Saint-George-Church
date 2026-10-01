import Link from "next/link";
import { linkButtonLabel } from "@/lib/link-button";

export default function LinkButton({
  href,
  label,
}: {
  href: string;
  label?: string | null;
}) {
  const isExternal = /^https?:\/\//i.test(href);

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="mt-4 inline-flex min-h-11 w-fit items-center justify-center rounded-full bg-deep-red px-5 text-sm font-bold text-cream transition hover:bg-coptic-gold-dark"
    >
      {linkButtonLabel(label)}
    </Link>
  );
}
