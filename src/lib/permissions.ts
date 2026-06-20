import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

// Access-control roles for the Better Auth admin plugin. Role names must match
// the UserRole enum in prisma/schema.prisma.
//
// Resources/actions extend the admin plugin's defaults (user + session
// management). Domain resources (products, orders, …) get added here as later
// phases need finer-grained permissions.
const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

// OWNER: full control, including user/admin management.
export const OWNER = ac.newRole({
  ...adminAc.statements,
});

// MANAGER: manage users but not ban/impersonate-heavy ops beyond listing/set-role.
export const MANAGER = ac.newRole({
  user: ["list", "set-role", "create"],
  session: ["list", "revoke"],
});

// STAFF: read-only on users/sessions; day-to-day order/stock work is governed
// by domain permissions added in later phases.
export const STAFF = ac.newRole({
  user: ["list"],
  session: ["list"],
});

// CUSTOMER: no admin permissions.
export const CUSTOMER = ac.newRole({});

export const roles = { OWNER, MANAGER, STAFF, CUSTOMER };
