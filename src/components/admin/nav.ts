import {
  BarChart3,
  Boxes,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Ticket,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { ADMIN_ROLES } from "@/lib/auth";

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this item. Defaults to all admin roles. */
  roles?: readonly AdminRole[];
  /** Route not built yet — shown disabled with a "Soon" badge. */
  comingSoon?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

// Information architecture for the whole admin panel. Items for unbuilt phases
// are flagged `comingSoon` so the roadmap is visible without dead 404 links.
// Role-restricted sections (settings, reports) are hidden for STAFF.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { label: "Fulfillment", href: "/admin/fulfillment", icon: Truck, comingSoon: true },
      { label: "Inventory", href: "/admin/inventory", icon: Boxes },
      { label: "Pre-orders", href: "/admin/preorders", icon: ClipboardList },
    ],
  },
  {
    label: "Growth",
    items: [
      {
        label: "Coupons",
        href: "/admin/coupons",
        icon: Ticket,
        roles: ["OWNER", "MANAGER"],
        comingSoon: true,
      },
      {
        label: "Reports",
        href: "/admin/reports",
        icon: BarChart3,
        roles: ["OWNER", "MANAGER"],
        comingSoon: true,
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        roles: ["OWNER", "MANAGER"],
        comingSoon: true,
      },
    ],
  },
];

/** Filter the nav to the groups/items a given role may see. */
export function navForRole(role: AdminRole): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}
