import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Seed Users
  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@insight.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@insight.com",
      password: hashedPassword,
      role: "SUPER_ADMIN"
    }
  });
  console.log("Seeded Super Admin user:", admin.email);

  const staff = await prisma.user.upsert({
    where: { email: "staff@insight.com" },
    update: {},
    create: {
      name: "Operational Staff",
      email: "staff@insight.com",
      password: hashedPassword,
      role: "STAFF"
    }
  });
  console.log("Seeded Staff user:", staff.email);

  const owner = await prisma.user.upsert({
    where: { email: "owner@insight.com" },
    update: {},
    create: {
      name: "Business Owner",
      email: "owner@insight.com",
      password: hashedPassword,
      role: "VIEWER"
    }
  });
  console.log("Seeded Viewer user:", owner.email);

  // 2. Seed Stores
  const stores = [
    { platform: "SHOPEE", storeName: "Insight Store Shopee" },
    { platform: "TIKTOK", storeName: "Insight Store TikTok Shop" }
  ];

  const seededStores = [];
  for (const store of stores) {
    const dbStore = await prisma.store.create({
      data: store
    });
    seededStores.push(dbStore);
    console.log("Seeded Store:", dbStore.storeName, `(${dbStore.platform})`);
  }

  // 3. Seed Products & Variants
  const products = [
    {
      sku: "PROD-TSHIRT-01",
      name: "Premium Cotton T-Shirt",
      category: "Apparel",
      costPrice: 45000.0,
      sellPrice: 99000.0,
      variants: {
        create: [
          { variantName: "Size S", stock: 120 },
          { variantName: "Size M", stock: 250 },
          { variantName: "Size L", stock: 180 }
        ]
      }
    },
    {
      sku: "PROD-JACKET-02",
      name: "Waterproof Bomber Jacket",
      category: "Apparel",
      costPrice: 150000.0,
      sellPrice: 299000.0,
      variants: {
        create: [
          { variantName: "Size M", stock: 80 },
          { variantName: "Size L", stock: 95 }
        ]
      }
    },
    {
      sku: "PROD-BOTTLE-03",
      name: "Stainless Steel Tumbler 500ml",
      category: "Home & Living",
      costPrice: 35000.0,
      sellPrice: 79000.0,
      variants: {
        create: [
          { variantName: "Matte Black", stock: 150 },
          { variantName: "Ocean Blue", stock: 140 }
        ]
      }
    }
  ];

  for (const product of products) {
    const dbProduct = await prisma.product.create({
      data: product
    });
    console.log("Seeded Product:", dbProduct.name, `(${dbProduct.sku})`);
  }

  console.log("Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
