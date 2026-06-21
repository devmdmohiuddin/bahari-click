"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/storefront/product-image";

export type GalleryImage = { url: string; alt: string | null };

// Main image + thumbnail strip + hover-zoom. Controlled by the parent's variant
// selection: when `images` changes (variant switch), the main image resets to
// the variant's first image.
export function ProductGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset to the first image whenever the image set changes (e.g. variant swap),
  // adjusting state during render rather than in an effect (avoids a cascade).
  const firstUrl = images[0]?.url;
  const [prevFirst, setPrevFirst] = useState(firstUrl);
  if (firstUrl !== prevFirst) {
    setPrevFirst(firstUrl);
    setActive(0);
  }

  const current = images[active] ?? images[0] ?? null;

  function onMove(e: React.MouseEvent) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ on: true, x, y });
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        onMouseMove={onMove}
        onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
        className="bg-muted relative aspect-square overflow-hidden rounded-2xl"
      >
        <ProductImage
          key={current?.url}
          src={current?.url ?? null}
          alt={current?.alt ?? title}
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={cn(
            "object-cover transition-transform duration-200 md:cursor-zoom-in",
            zoom.on && "md:scale-[1.8]",
          )}
          style={zoom.on ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "bg-muted relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors sm:size-20",
                i === active ? "border-brand" : "hover:border-border border-transparent",
              )}
            >
              <ProductImage
                src={img.url}
                alt={img.alt ?? `${title} thumbnail ${i + 1}`}
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
