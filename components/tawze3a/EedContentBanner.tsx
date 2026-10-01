function CopticDivider() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-linear-to-l from-coptic-gold-main to-transparent" />
      <svg viewBox="0 0 48 48" className="h-8 w-8 text-coptic-gold-dark">
        <path
          d="M24 5v38M8 20h32"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="24" cy="20" r="5.5" fill="#fffdf6" stroke="currentColor" strokeWidth="1.7" />
      </svg>
      <span className="h-px flex-1 bg-linear-to-r from-coptic-gold-main to-transparent" />
    </div>
  );
}

function Inscription({
  label,
  text,
  emphasis = false,
}: {
  label: string;
  text: string;
  emphasis?: boolean;
}) {
  return (
    <div className="relative">
      <p className="text-sm font-bold text-coptic-gold-dark">{label}</p>
      <span className="mx-auto mt-2 block h-0.5 w-10 rounded-full bg-coptic-gold-main" />
      <p
        className={`mx-auto mt-4 max-w-3xl font-bold whitespace-pre-line ${
          emphasis
            ? "text-3xl leading-relaxed text-deep-red md:text-5xl"
            : "text-2xl leading-[1.9] text-deep-red/90 md:text-4xl"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

export default function EedContentBanner({
  goal,
  slogan,
  compact = false,
}: {
  goal?: string | null;
  slogan?: string | null;
  compact?: boolean;
}) {
  const goalText = goal?.trim() ?? "";
  const sloganText = slogan?.trim() ?? "";

  if (!goalText && !sloganText) {
    return null;
  }

  return (
    <section
      className={`relative mb-8 overflow-hidden rounded-4xl border-2 border-coptic-gold-main bg-[#fffdf6] text-center shadow-[0_22px_50px_-28px_rgba(139,30,63,0.55)] ${
        compact ? "px-5 py-8" : "px-6 py-10 md:px-14 md:py-14"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.28),transparent_46%)]" />
      <div className="pointer-events-none absolute inset-3 rounded-3xl border border-deep-red/20 md:inset-4" />
      <span className="pointer-events-none absolute top-5 right-5 h-4 w-4 border-t-2 border-r-2 border-coptic-gold-dark" />
      <span className="pointer-events-none absolute top-5 left-5 h-4 w-4 border-t-2 border-l-2 border-coptic-gold-dark" />
      <span className="pointer-events-none absolute right-5 bottom-5 h-4 w-4 border-r-2 border-b-2 border-coptic-gold-dark" />
      <span className="pointer-events-none absolute bottom-5 left-5 h-4 w-4 border-b-2 border-l-2 border-coptic-gold-dark" />
      <div className="relative space-y-8">
        {goalText ? <Inscription label="الهدف" text={goalText} /> : null}
        {goalText && sloganText ? <CopticDivider /> : null}
        {sloganText ? <Inscription label="الشعار" text={sloganText} emphasis /> : null}
      </div>
    </section>
  );
}
