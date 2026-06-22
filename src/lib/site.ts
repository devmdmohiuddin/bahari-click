// Canonical site origin for metadata, canonical URLs, sitemap, and JSON-LD.
// Falls back to localhost in dev when NEXT_PUBLIC_APP_URL isn't set.
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

export const SITE_NAME = "Bahari Click";

export const SITE_DESCRIPTION = "Quality products, delivered across Bangladesh. Cash on delivery.";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = ""): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// Optional support channels (floating chat button). Digits only for WhatsApp.
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(
  /[^\d]/g,
  "",
);
export const MESSENGER_URL = process.env.NEXT_PUBLIC_MESSENGER_URL || "";
