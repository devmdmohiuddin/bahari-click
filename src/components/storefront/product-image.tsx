"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { cloudinaryLoader } from "@/lib/cloudinary-loader";

// next/image wrapper bound to the Cloudinary loader, with a graceful fallback
// for missing/broken images. Client component so the loader function stays
// inside the client boundary.
export function ProductImage({
  src,
  alt,
  sizes,
  className,
  priority,
}: {
  src: string | null;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={cn(
          "bg-muted text-muted-foreground/40 flex items-center justify-center",
          className,
        )}
      >
        <ImageOff className="size-8" />
      </div>
    );
  }

  return (
    <Image
      loader={cloudinaryLoader}
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
      priority={priority}
      onError={() => setErrored(true)}
      className={className}
    />
  );
}
