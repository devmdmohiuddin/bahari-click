// Central rate-limit policy for every public/abuse-prone endpoint. One place to
// review coverage (F6.3 hardening). Windows are in seconds.

export interface RateLimitPolicy {
  limit: number;
  windowSec: number;
}

const HOUR = 60 * 60;

export const RATE_LIMITS = {
  otpSend: { limit: 5, windowSec: HOUR }, // per phone
  reviewCreate: { limit: 5, windowSec: HOUR }, // per IP
  preorderCreate: { limit: 10, windowSec: HOUR }, // per IP
  orderPlace: { limit: 10, windowSec: HOUR }, // per IP
  orderTrack: { limit: 30, windowSec: HOUR }, // per IP
  couponValidate: { limit: 20, windowSec: HOUR }, // per IP
  search: { limit: 120, windowSec: HOUR }, // per IP
  smsPerRecipient: { limit: 20, windowSec: HOUR }, // per phone
} satisfies Record<string, RateLimitPolicy>;
