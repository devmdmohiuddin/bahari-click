import { listCoupons } from "@/server/services/coupon";
import { CouponsManager, type CouponRow } from "@/components/admin/coupons/coupons-manager";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const coupons = await listCoupons();
  const rows: CouponRow[] = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    minOrder: c.minOrder,
    maxDiscount: c.maxDiscount,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    startsAt: c.startsAt?.toISOString() ?? null,
    endsAt: c.endsAt?.toISOString() ?? null,
    isActive: c.isActive,
  }));
  return <CouponsManager coupons={rows} />;
}
