import { v2 as cloudinary } from "cloudinary";

// Server-only Cloudinary helper. Credentials come from env; in dev they may be
// empty (image upload simply won't work until you add a free Cloudinary account).
// See docs/06-cost-and-free-tiers.md.

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "bahari-click/dev";

export function isCloudinaryConfigured(): boolean {
  return Boolean(cloudName && apiKey && apiSecret);
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/**
 * Build a signed payload for a direct browser → Cloudinary upload. The browser
 * never sees the API secret; it posts the file + this signature to Cloudinary.
 */
export function signUpload(params: Record<string, string | number> = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_* env vars.");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const toSign = { timestamp, folder: CLOUDINARY_FOLDER, ...params };

  const signature = cloudinary.utils.api_sign_request(toSign, apiSecret as string);

  return {
    cloudName: cloudName as string,
    apiKey: apiKey as string,
    timestamp,
    folder: CLOUDINARY_FOLDER,
    signature,
  };
}

export { cloudinary };
