import "dotenv/config";

import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";

// Seed scaffold. Idempotent. Provisions the first OWNER admin so /admin is
// reachable in dev. Catalog/demo data gets added in later phases.

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "owner@bahari.local";
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "Owner@12345";
const OWNER_NAME = process.env.SEED_OWNER_NAME ?? "Store Owner";

async function seedOwner() {
  const existing = await db.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (existing) {
    console.info(`✔ Owner already exists: ${OWNER_EMAIL}`);
    return;
  }

  // Use Better Auth so the password is hashed exactly as sign-in expects.
  await auth.api.signUpEmail({
    body: { email: OWNER_EMAIL, password: OWNER_PASSWORD, name: OWNER_NAME },
  });

  await db.user.update({
    where: { email: OWNER_EMAIL },
    data: { role: "OWNER", emailVerified: true },
  });

  console.info(`✔ Created OWNER admin: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
}

async function main() {
  console.info("🌱 Seeding…");
  await seedOwner();
  console.info("✅ Seed complete.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
