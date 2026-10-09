// Demo coupon table. The checkout API re-checks the code on the server, so the
// client value is only a preview. Move this to a `coupons` table when needed.
const COUPONS: Record<string, number> = {
  PEACE10: 0.1,
};

export function getDiscountRate(code: string | null | undefined) {
  if (!code) return 0;
  return COUPONS[code.trim().toUpperCase()] ?? 0;
}
