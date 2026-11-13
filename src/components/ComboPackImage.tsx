"use client";

import Image from "next/image";
import { useState } from "react";
import { TourismPhotoCredit } from "@/components/TourismImage";
import { resolveComboPackImage } from "@/lib/combo-images";
import { TOURISM_IMAGE_ASSETS } from "@/lib/constants";

interface ComboPackImageProps {
  slug: string;
  name: string;
  fallbackIcon: string;
  sizes: string;
  className: string;
  fallbackLabel?: string;
  creditClassName?: string;
}

export function ComboPackImage({
  slug,
  name,
  fallbackIcon,
  sizes,
  className,
  fallbackLabel = "Package photo not independently verified",
  creditClassName,
}: ComboPackImageProps) {
  const image = resolveComboPackImage(slug, TOURISM_IMAGE_ASSETS);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!image || failedSrc === image.src) {
    const label = failedSrc === image?.src ? "Package photo unavailable" : fallbackLabel;
    return (
      <div
        role="img"
        aria-label={`${name}: ${label}`}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-100 to-indigo-100 px-4 text-center text-violet-800"
      >
        <span className="text-4xl" aria-hidden="true">{fallbackIcon}</span>
        <span className="text-xs font-semibold">{label}</span>
      </div>
    );
  }

  return (
    <>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        className={className}
        onError={() => {
          console.error("Failed to load combo package photo.", { slug, src: image.src });
          setFailedSrc(image.src);
        }}
      />
      {image.attribution && (
        <div className="absolute bottom-2 left-2 z-10 max-w-[85%] rounded bg-black/55 px-2 py-1">
          <TourismPhotoCredit
            attribution={image.attribution}
            className={creditClassName ?? "text-[10px] leading-4 text-white/90"}
          />
        </div>
      )}
    </>
  );
}
