"use client";

import type { ImageLoaderProps } from "next/image";

// Custom next/image loader for Cloudinary delivery URLs. Injects responsive
// width + automatic format/quality so image-heavy pages stay light on BD mobile
// networks (docs/06-cost-and-free-tiers.md). Non-Cloudinary URLs pass through
// untouched, so local/placeholder images still work.
const UPLOAD_MARKER = "/image/upload/";

export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  const idx = src.indexOf(UPLOAD_MARKER);
  if (!src.includes("res.cloudinary.com") || idx === -1) return src;

  const transform = `f_auto,q_${quality ?? "auto"},c_limit,w_${width}`;
  const head = src.slice(0, idx + UPLOAD_MARKER.length);
  const tail = src.slice(idx + UPLOAD_MARKER.length);
  return `${head}${transform}/${tail}`;
}
