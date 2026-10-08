import { prisma } from "@/lib/prisma";
import { EED_EL_KHODAM_CONTENT_ID } from "@/lib/eed-constants";

export {
  EED_EL_KHODAM_CONTENT_ID,
  GALLERY_MEDIA_IMAGE,
  GALLERY_MEDIA_YOUTUBE,
} from "@/lib/eed-constants";

export type EedSiteContent = {
  goal: string | null;
  slogan: string | null;
  sloganLogo: string | null;
};

export async function getEedSiteContent(): Promise<EedSiteContent> {
  const empty: EedSiteContent = { goal: null, slogan: null, sloganLogo: null };

  try {
    const content = await prisma.siteContent.findUnique({
      where: { id: EED_EL_KHODAM_CONTENT_ID },
      select: { goal: true, slogan: true },
    });
    const logoRows = await prisma.$queryRaw<Array<{ sloganLogo: string | null }>>`
      SELECT sloganLogo FROM SiteContent WHERE id = ${EED_EL_KHODAM_CONTENT_ID}
    `;

    return {
      goal: content?.goal ?? null,
      slogan: content?.slogan ?? null,
      sloganLogo: logoRows[0]?.sloganLogo ?? null,
    };
  } catch {
    return empty;
  }
}
