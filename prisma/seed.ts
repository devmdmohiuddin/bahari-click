import "dotenv/config";

import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";
import { createCategory, createSubcategory } from "../src/server/services/category";
import {
  createProduct,
  getProductBySlug,
  setProductPublished,
} from "../src/server/services/product";
import { createReview, setReviewApproved } from "../src/server/services/review";

// Seed scaffold. Idempotent. Provisions the first OWNER admin so /admin is
// reachable in dev, plus a small demo catalog so the storefront has something
// to render in Phase 1.

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

const DEMO_PRODUCT_SLUG = "classic-leather-wallet";

async function seedCatalog() {
  if (await db.product.findUnique({ where: { slug: DEMO_PRODUCT_SLUG }, select: { id: true } })) {
    console.info("✔ Demo catalog already present");
    return;
  }

  const category = await createCategory({ name: "Accessories", sortOrder: 1 });
  const subcategory = await createSubcategory({
    categoryId: category.id,
    name: "Wallets",
    sortOrder: 1,
  });

  // A product with 2 colors × 2 sizes (4 variants), gallery, variant images, specs.
  const img = (label: string) => `https://res.cloudinary.com/demo/image/upload/sample.jpg#${label}`;
  const colors = ["Black", "Brown"];
  const sizes = ["Standard", "Slim"];

  const product = await createProduct({
    title: "Classic Leather Wallet",
    subcategoryId: subcategory.id,
    description: "Genuine PU leather bifold wallet with RFID protection.",
    basePrice: 850,
    compareAtPrice: 1200,
    soldCountBoost: 120,
    images: [
      { url: img("gallery-1"), alt: "Front", sortOrder: 0 },
      { url: img("gallery-2"), alt: "Open", sortOrder: 1 },
    ],
    specs: [
      { key: "Material", value: "PU Leather", sortOrder: 0 },
      { key: "Warranty", value: "7-day replacement", sortOrder: 1 },
    ],
    variants: colors.flatMap((color, ci) =>
      sizes.map((size, si) => ({
        color,
        size,
        price: size === "Slim" ? 800 : 850,
        stock: 10 + ci * 5 + si,
        images: [{ url: img(`${color}-${size}`), alt: `${color} ${size}`, sortOrder: 0 }],
      })),
    ),
  });

  await setProductPublished(product.id, true);
  console.info(`✔ Created demo product: ${product.title} (${product.variants.length} variants)`);
}

async function seedReviews() {
  const product = await db.product.findUnique({
    where: { slug: DEMO_PRODUCT_SLUG },
    select: { id: true, _count: { select: { reviews: true } } },
  });
  if (!product || product._count.reviews > 0) {
    console.info("✔ Demo reviews already present");
    return;
  }

  // Two reviews: one approved (counts toward aggregates), one left pending.
  const approved = await createReview({
    productId: product.id,
    guestName: "Rahim",
    rating: 5,
    comment: "Great quality, fast delivery!",
  });
  await setReviewApproved(approved.id, true);
  await createReview({
    productId: product.id,
    guestName: "Karim",
    rating: 3,
    comment: "Decent but smaller than expected.",
  });
  console.info("✔ Created demo reviews (1 approved, 1 pending)");
}

async function seedShippingZones() {
  if ((await db.shippingZone.count()) > 0) {
    console.info("✔ Shipping zones already present");
    return;
  }
  await db.shippingZone.createMany({
    data: [
      { name: "Inside Dhaka", fee: 60, freeShipThreshold: 2000, sortOrder: 1 },
      { name: "Sub-Dhaka", fee: 100, sortOrder: 2 },
      { name: "Outside Dhaka", fee: 130, sortOrder: 3 },
    ],
  });
  console.info("✔ Created shipping zones (Inside/Sub/Outside Dhaka)");
}

async function main() {
  console.info("🌱 Seeding…");
  await seedOwner();
  await seedCatalog();
  await seedReviews();
  await seedShippingZones();

  // Read-back verification (Phase 1 acceptance).
  const readBack = await getProductBySlug(DEMO_PRODUCT_SLUG);
  if (readBack) {
    const variantImages = readBack.variants.reduce((n, v) => n + v.images.length, 0);
    console.info(
      `🔎 Read back "${readBack.title}": ${readBack.variants.length} variants, ` +
        `${readBack.images.length} gallery images, ${variantImages} variant images, ` +
        `${readBack.specs.length} specs, soldDisplay=${readBack.soldCountDisplay}`,
    );
    console.info(
      `🔎 Aggregates: ratingAvg=${readBack.ratingAvg} ratingCount=${readBack.ratingCount} ` +
        `(only the approved review counts)`,
    );
  }

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
