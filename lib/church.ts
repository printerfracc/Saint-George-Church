export const CHURCH_NAME = "كنيسة الشهيد العظيم مارجرجس بالمطرية";
export const CHURCH_SHORT_NAME = "كنيسة مارجرجس المطرية";
export const CHURCH_LOGO = "/logo.png";
export const CHURCH_OG_IMAGE = "/hero-bg.jpg";
export const CHURCH_DESCRIPTION = `الموقع الرسمي ل${CHURCH_NAME}`;
export const CHURCH_SEO_DESCRIPTION =
  "الموقع الرسمي لكنيسة الشهيد العظيم مارجرجس بالمطرية. تابع مواعيد القداسات، الأخبار، والنهضات الروحية. Official website of St. George Coptic Orthodox Church in El Matareya.";

export const CHURCH_SEO_KEYWORDS = [
  "كنيسة مارجرجس المطرية",
  "كنيسه مارجرجس المطريه",
  "كنيسة الشهيد العظيم مارجرجس بالمطرية",
  "مارجرجس المطرية",
  "مارجرجس المطريه",
  "كنيسة مار جرجس",
  "Saint George matarya church",
  "St George Church El Matareya",
  "St George Coptic Church Matarya",
];

export const CHURCH_ALTERNATE_NAMES = [
  "كنيسه مارجرجس المطريه",
  "مارجرجس المطرية",
  "Saint George Matarya Church",
  "St. George Coptic Orthodox Church El Matareya",
];

export const CHURCH_PHONE_NUMBERS = [
  "01200434061",
  "0222525013",
  "01289627399",
  "01279623454",
];

export const CHURCH_GEO = {
  latitude: 30.1260901,
  longitude: 31.2977018,
  addressLocality: "المطرية",
  addressRegion: "القاهرة",
  addressCountry: "EG",
} as const;

export function toInternationalPhone(localNumber: string) {
  const digits = localNumber.replace(/\D/g, "");

  if (digits.startsWith("20")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+20${digits.slice(1)}`;
  }

  return `+20${digits}`;
}

export const FRACC_NAME = "مركز ابونا اندراوس الصموئيلي للكمبيوتر";
export const FRACC_LOGO = "/Fracc.png";
export const FRACC_FACEBOOK = "https://www.facebook.com/FraccStGeorge";
export const FRACC_WHATSAPP = "01274875045";

export const YOUTUBE_CHANNEL_HANDLE = "StGeorgeChurchMataria";
export const YOUTUBE_CHANNEL_URL =
  "https://www.youtube.com/@StGeorgeChurchMataria";
export const YOUTUBE_STREAMS_URL =
  "https://www.youtube.com/@StGeorgeChurchMataria/streams";
