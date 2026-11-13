
"use client";

import { useState } from "react";
import Image from "next/image";

export type TourismImageAttribution = {
  name: string;
  source: string;
  license: string;
  licenseUrl: string;
};

type TourismImageProps = {
  src: string;
  alt: string;
  sizes: string;
  attribution?: TourismImageAttribution;
  className?: string;
  loading?: "eager" | "lazy";
  objectPosition?: string;
  unverifiedLabel?: string;
  unavailableLabel?: string;
  fallbackClassName?: string;
  fallbackTextClassName?: string;
};

export function TourismImage({
  src,
  alt,
  sizes,
  className,
  loading = "lazy",
  objectPosition,
  unavailableLabel = "Photo unavailable",
  fallbackClassName = "absolute inset-0 flex items-center justify-center bg-slate-100 px-4 text-center text-slate-500",
  fallbackTextClassName = "text-xs font-semibold",
}: TourismImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const hasError = failedSrc === src;

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt || unavailableLabel}
        className={fallbackClassName}
      >
        <span className={fallbackTextClassName}>
          {unavailableLabel}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      loading={loading}
      unoptimized={src.startsWith("https://")}
      onError={() => {
        console.error("Failed to load tourism photo:", src);
        setFailedSrc(src);
      }}
      sizes={sizes}
      style={objectPosition ? { objectPosition } : undefined}
      className={className}
    />
  );
}

export function TourismPhotoCredit({
  attribution,
  className = "mt-1 inline-block max-w-full truncate text-[10px] leading-4 text-slate-500",
}: {
  attribution?: TourismImageAttribution;
  className?: string;
}) {
  if (!attribution) return null;

  return (
    <p className={className}>
      Photo:{" "}
      <a
        href={attribution.source}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-current/40 underline-offset-2 hover:opacity-80"
      >
        {attribution.name}
      </a>
      {" · "}
      <a
        href={attribution.licenseUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-current/40 underline-offset-2 hover:opacity-80"
      >
        {attribution.license}
      </a>
    </p>
  );
}
