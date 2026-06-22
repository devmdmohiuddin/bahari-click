import "dotenv/config";

import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";
import { createCategory, createSubcategory } from "../src/server/services/category";
import {
  createProduct,
  getProductBySlug,
  setProductPublished,
  slugify,
} from "../src/server/services/product";
import type { ProductCreateInput } from "../src/server/validators/catalog";
import { createReview, setReviewApproved } from "../src/server/services/review";
import { createCampaign, getCampaignBySlug } from "../src/server/services/campaign";

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

// ── Richer demo catalog (idempotent per-slug) ────────────────────────────────
// Gives the storefront a full grid to render across two categories, with a mix
// of single-/multi-variant products, sale prices, sold-count boosts, and one
// out-of-stock item. Re-running only adds what's missing.

const CLD = (id: string) => `https://res.cloudinary.com/demo/image/upload/${id}`;
const DEMO_IMAGES = [
  "samples/ecommerce/leather-bag-gray.jpg",
  "samples/ecommerce/accessories-bag.jpg",
  "samples/ecommerce/shoes.jpg",
  "cld-sample.jpg",
  "cld-sample-2.jpg",
  "cld-sample-3.jpg",
  "cld-sample-4.jpg",
  "cld-sample-5.jpg",
];

async function ensureCategory(name: string, sortOrder: number) {
  const slug = slugify(name);
  const existing = await db.category.findUnique({ where: { slug }, select: { id: true } });
  if (existing) return existing.id;
  const created = await createCategory({ name, sortOrder, isActive: true });
  return created.id;
}

async function ensureSubcategory(categoryId: string, name: string, sortOrder: number) {
  const slug = slugify(name);
  const existing = await db.subcategory.findUnique({ where: { slug }, select: { id: true } });
  if (existing) return existing.id;
  const created = await createSubcategory({ categoryId, name, sortOrder, isActive: true });
  return created.id;
}

type DemoProduct = Omit<ProductCreateInput, "subcategoryId"> & { featured?: boolean };

function defaultDescription(title: string): string {
  return [
    `<p><strong>${title}</strong> — picked for everyday quality and value, delivered anywhere in Bangladesh with cash on delivery.</p>`,
    `<p>Carefully sourced and quality-checked before it ships. If it isn't right, our 7-day easy return has you covered.</p>`,
    `<h3>Why you'll love it</h3>`,
    `<ul><li>Durable, premium materials</li><li>Great value for the price</li><li>Fast nationwide delivery</li></ul>`,
  ].join("");
}

function defaultSpecs(): { key: string; value: string }[] {
  return [
    { key: "Brand", value: "Bahari" },
    { key: "Warranty", value: "7-day replacement" },
    { key: "Delivery", value: "Cash on delivery, nationwide" },
    { key: "Country of origin", value: "Imported" },
  ];
}

async function addProduct(subcategoryId: string, input: DemoProduct) {
  const slug = slugify(input.slug ?? input.title);
  if (await db.product.findUnique({ where: { slug }, select: { id: true } })) return;
  const { featured, ...rest } = input;
  const product = await createProduct({
    description: defaultDescription(input.title),
    specs: defaultSpecs().map((s, i) => ({ ...s, sortOrder: i })),
    ...rest,
    subcategoryId,
    isFeatured: featured ?? false,
  });
  await setProductPublished(product.id, true);
}

/** Backfill description/specs on demo products created by earlier seed runs so
 *  PDP Description/Specifications tabs have content without a DB reset. */
async function ensureDetails(slug: string, title: string) {
  const p = await db.product.findUnique({
    where: { slug },
    select: { id: true, description: true, _count: { select: { specs: true } } },
  });
  if (!p) return;
  if (!p.description || p.description.trim() === "") {
    await db.product.update({
      where: { id: p.id },
      data: { description: defaultDescription(title) },
    });
  }
  if (p._count.specs === 0) {
    await db.specification.createMany({
      data: defaultSpecs().map((s, i) => ({
        productId: p.id,
        key: s.key,
        value: s.value,
        sortOrder: i,
      })),
    });
  }
}

async function seedDemoCatalog() {
  const accessories = await ensureCategory("Accessories", 1);
  const gadgets = await ensureCategory("Gadgets", 2);

  const belts = await ensureSubcategory(accessories, "Belts", 2);
  const sunglasses = await ensureSubcategory(accessories, "Sunglasses", 3);
  const earbuds = await ensureSubcategory(gadgets, "Earbuds", 1);
  const chargers = await ensureSubcategory(gadgets, "Chargers", 2);
  const watches = await ensureSubcategory(gadgets, "Smartwatches", 3);

  const img = (i: number) => [
    { url: CLD(DEMO_IMAGES[i % DEMO_IMAGES.length]), alt: null, sortOrder: 0 },
  ];
  // Single-variant product → quick add-to-cart works straight from the card.
  const single = (price: number, stock = 25) => [{ price, stock }];

  const catalog: [string, DemoProduct][] = [
    [
      belts,
      {
        title: "Genuine Leather Belt",
        basePrice: 650,
        compareAtPrice: 900,
        soldCountBoost: 240,
        featured: true,
        images: img(0),
        variants: single(650),
      },
    ],
    [
      belts,
      {
        title: "Reversible Formal Belt",
        basePrice: 780,
        soldCountBoost: 60,
        images: img(1),
        variants: single(780),
      },
    ],
    [
      sunglasses,
      {
        title: "Polarized Aviator Sunglasses",
        basePrice: 1200,
        compareAtPrice: 1800,
        soldCountBoost: 510,
        featured: true,
        images: img(2),
        variants: single(1200),
      },
    ],
    [
      sunglasses,
      {
        title: "Retro Round Sunglasses",
        basePrice: 950,
        soldCountBoost: 130,
        images: img(3),
        variants: single(950, 0),
      },
    ],
    [
      earbuds,
      {
        title: "Wireless ANC Earbuds Pro",
        basePrice: 2200,
        compareAtPrice: 2990,
        soldCountBoost: 1320,
        featured: true,
        images: img(4),
        variants: [
          { color: "Black", price: 2200, stock: 18 },
          { color: "White", price: 2200, stock: 12 },
        ],
      },
    ],
    [
      earbuds,
      {
        title: "Sport Bluetooth Earphones",
        basePrice: 1450,
        soldCountBoost: 420,
        images: img(5),
        variants: single(1450),
      },
    ],
    [
      chargers,
      {
        title: "65W GaN Fast Charger",
        basePrice: 1850,
        compareAtPrice: 2400,
        soldCountBoost: 770,
        featured: true,
        images: img(6),
        variants: single(1850),
      },
    ],
    [
      chargers,
      {
        title: "3-in-1 Charging Cable",
        basePrice: 350,
        soldCountBoost: 980,
        images: img(7),
        variants: single(350),
      },
    ],
    [
      chargers,
      {
        title: "10000mAh Power Bank",
        basePrice: 1300,
        compareAtPrice: 1600,
        soldCountBoost: 640,
        images: img(0),
        variants: single(1300),
      },
    ],
    [
      watches,
      {
        title: "AMOLED Smartwatch",
        basePrice: 3200,
        compareAtPrice: 4500,
        soldCountBoost: 1850,
        featured: true,
        images: img(1),
        variants: [
          { size: "44mm", price: 3200, stock: 9 },
          { size: "40mm", price: 3000, stock: 14 },
        ],
      },
    ],
    [
      watches,
      {
        title: "Fitness Tracker Band",
        basePrice: 1100,
        soldCountBoost: 360,
        images: img(2),
        variants: single(1100),
      },
    ],
    [
      watches,
      {
        title: "Classic Analog Watch",
        basePrice: 2400,
        soldCountBoost: 75,
        images: img(3),
        variants: single(2400),
      },
    ],
  ];

  let added = 0;
  for (const [subcategoryId, product] of catalog) {
    const slug = slugify(product.title);
    const before = await db.product.findUnique({ where: { slug }, select: { id: true } });
    await addProduct(subcategoryId, product);
    if (!before) added++;
  }

  // Backfill PDP details on demo products (incl. the original wallet) so the
  // Description/Specifications tabs render even on databases seeded earlier.
  for (const [, product] of catalog) await ensureDetails(slugify(product.title), product.title);
  await ensureDetails(DEMO_PRODUCT_SLUG, "Classic Leather Wallet");

  console.info(`✔ Demo catalog enriched (${added} new products across Accessories & Gadgets)`);
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

async function seedCampaigns() {
  // Flash sale (3-day window) over a curated product set.
  if (!(await getCampaignBySlug("eid-flash-sale"))) {
    await createCampaign({
      title: "Eid Flash Sale",
      slug: "eid-flash-sale",
      type: "flash",
      endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      isActive: true,
      config: {
        subtitle: "Limited-time deals on top picks — grab them before they’re gone.",
        couponCode: "EID10",
        productSlugs: [
          "polarized-aviator-sunglasses",
          "wireless-anc-earbuds-pro",
          "65w-gan-fast-charger",
          "amoled-smartwatch",
          "genuine-leather-belt",
          "10000mah-power-bank",
        ],
      },
    });
    console.info("✔ Created demo flash campaign: /campaigns/eid-flash-sale");
  }

  // Single-product FB-ad landing page.
  if (!(await getCampaignBySlug("smartwatch-offer"))) {
    await createCampaign({
      title: "AMOLED Smartwatch — Special Offer",
      slug: "smartwatch-offer",
      type: "landing",
      isActive: true,
      config: {
        productSlug: "amoled-smartwatch",
        subtitle: "Crisp AMOLED display, fitness tracking, and all-day battery.",
        benefits: [
          "Cash on delivery",
          "7-day easy returns",
          "Nationwide delivery",
          "1-year warranty",
        ],
      },
    });
    console.info("✔ Created demo landing campaign: /campaigns/smartwatch-offer");
  }
}

async function main() {
  console.info("🌱 Seeding…");
  await seedOwner();
  await seedCatalog();
  await seedDemoCatalog();
  await seedCampaigns();
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
