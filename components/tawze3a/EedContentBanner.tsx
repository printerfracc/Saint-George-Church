import Image from "next/image";

function CopticMark() {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <svg viewBox="0 0 48 48" className="h-5 w-5 text-coptic-gold-main">
        <path
          d="M24 6v36M10 20h28"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="24" cy="20" r="4.5" fill="#f7f3e9" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </div>
  );
}

function Inscription({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-sm font-bold text-coptic-gold-dark">{label}</p>
      <p className="mt-4 text-pretty text-xl font-bold leading-[2.2] whitespace-pre-line text-deep-red md:text-2xl">
        {text}
      </p>
    </div>
  );
}

function SloganBlock({ logo, text }: { logo: string; text: string }) {
  return (
    <div>
      <p className="text-sm font-bold text-coptic-gold-dark">الشعار</p>
      {logo ? (
        <div className="relative mx-auto mt-5 aspect-square w-36 md:w-44">
          <Image
            src={logo}
            alt="شعار عيد الخدام"
            fill
            unoptimized
            className="object-contain"
          />
        </div>
      ) : null}
      {text ? (
        <p className="mt-4 text-pretty text-sm leading-8 whitespace-pre-line text-deep-red/80 md:text-base">
          {text}
        </p>
      ) : null}
    </div>
  );
}

export default function EedContentBanner({
  goal,
  slogan,
  sloganLogo,
}: {
  goal?: string | null;
  slogan?: string | null;
  sloganLogo?: string | null;
}) {
  const goalText = goal?.trim() ?? "";
  const sloganText = slogan?.trim() ?? "";
  const logo = sloganLogo?.trim() ?? "";
  const hasSlogan = Boolean(logo || sloganText);

  if (!goalText && !hasSlogan) {
    return null;
  }

  return (
    <section className="mx-auto mb-10 max-w-md text-center">
      <div className="space-y-8">
        {goalText ? <Inscription label="الهدف" text={goalText} /> : null}
        {goalText && hasSlogan ? <CopticMark /> : null}
        {hasSlogan ? <SloganBlock logo={logo} text={sloganText} /> : null}
      </div>
    </section>
  );
}
