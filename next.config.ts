import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary CDN — image-heavy pages for BD mobile networks.
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

// Sentry wrapping is a no-op at runtime unless a DSN is configured (see env).
// Only apply the build-time plugin when an auth token is present so local/CI
// builds without Sentry credentials stay free and unblocked.
const withSentry =
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
    ? (cfg: NextConfig) =>
        withSentryConfig(cfg, {
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          silent: true,
          disableLogger: true,
        })
    : (cfg: NextConfig) => cfg;

export default withSentry(nextConfig);
