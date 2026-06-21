// Primary storefront nav. Category links are injected dynamically in Phase 1;
// these are the always-present entries.
export type NavLink = { label: string; href: string };

export const PRIMARY_NAV: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "All products", href: "/products" },
  { label: "Track order", href: "/track" },
];
