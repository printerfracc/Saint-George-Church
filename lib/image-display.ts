export const IMAGE_DISPLAY_MODES = ["NORMAL", "PORTRAIT_450_730"] as const;

export type ImageDisplayMode = (typeof IMAGE_DISPLAY_MODES)[number];

export function parseImageDisplayMode(value?: string | null): ImageDisplayMode {
  return value === "PORTRAIT_450_730" ? "PORTRAIT_450_730" : "NORMAL";
}

export function isPortraitDisplay(mode?: string | null) {
  return parseImageDisplayMode(mode) === "PORTRAIT_450_730";
}

export function imageDisplayFrameClass(
  mode?: string | null,
  fallback = "relative aspect-video",
) {
  if (isPortraitDisplay(mode)) {
    return "relative mx-auto aspect-[450/730] w-full max-w-[450px] overflow-hidden";
  }

  return fallback;
}
