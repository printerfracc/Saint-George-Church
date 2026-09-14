import Image from "next/image";
import { CHURCH_LOGO, CHURCH_NAME } from "@/lib/church";

export default function ChurchLogo({
  size = 48,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={CHURCH_LOGO}
      alt={CHURCH_NAME}
      width={size}
      height={size}
      priority={priority}
      className={`h-auto w-auto object-contain ${className}`}
    />
  );
}
