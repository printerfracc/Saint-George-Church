"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image, { type ImageProps } from "next/image";
import { hasImageSrc } from "@/lib/optional-image";

type OptionalImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  frameClassName?: string;
  children?: ReactNode;
};

export default function OptionalImage({
  src,
  alt,
  frameClassName,
  className,
  unoptimized = true,
  onError,
  children,
  ...props
}: OptionalImageProps) {
  const url = src?.trim() ?? "";
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!hasImageSrc(url) || failed) {
    return null;
  }

  const usesFill = "fill" in props && props.fill === true;
  const frame =
    frameClassName ?? (usesFill ? "absolute inset-0 overflow-hidden" : undefined);

  const image = (
    <Image
      src={url}
      alt={alt}
      unoptimized={unoptimized}
      className={className}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      {...props}
    />
  );

  if (frame) {
    return (
      <div className={frame}>
        {image}
        {children}
      </div>
    );
  }

  return image;
}
