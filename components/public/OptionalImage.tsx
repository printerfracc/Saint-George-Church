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

  if (frameClassName) {
    return (
      <div className={frameClassName}>
        {image}
        {children}
      </div>
    );
  }

  return image;
}
