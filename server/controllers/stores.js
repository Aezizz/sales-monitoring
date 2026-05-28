import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getStores = async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: "desc" }
    });
    return res.status(200).json(stores);
  } catch (error) {
    console.error("Get stores error:", error);
    return res.status(500).json({ message: "Failed to fetch stores" });
  }
};

export const createStore = async (req, res) => {
  const { platform, storeName } = req.body;

  if (!platform || !storeName) {
    return res.status(400).json({ message: "Platform and store name are required" });
  }

  // Validate platform
  const validPlatforms = ["SHOPEE", "TIKTOK"];
  if (!validPlatforms.includes(platform.toUpperCase())) {
    return res.status(400).json({ message: "Platform must be either SHOPEE or TIKTOK" });
  }

  try {
    const store = await prisma.store.create({
      data: {
        platform: platform.toUpperCase(),
        storeName
      }
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "CREATE",
          entity: `Store: ${store.storeName} (${store.platform})`
        }
      });
    }

    return res.status(201).json(store);
  } catch (error) {
    console.error("Create store error:", error);
    return res.status(500).json({ message: "Failed to create store" });
  }
};

export const updateStore = async (req, res) => {
  const { id } = req.params;
  const { platform, storeName } = req.body;

  try {
    const existing = await prisma.store.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Store not found" });
    }

    if (platform) {
      const validPlatforms = ["SHOPEE", "TIKTOK"];
      if (!validPlatforms.includes(platform.toUpperCase())) {
        return res.status(400).json({ message: "Platform must be either SHOPEE or TIKTOK" });
      }
    }

    const updated = await prisma.store.update({
      where: { id },
      data: {
        platform: platform ? platform.toUpperCase() : existing.platform,
        storeName: storeName !== undefined ? storeName : existing.storeName
      }
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "UPDATE",
          entity: `Store: ${updated.storeName} (${updated.platform})`
        }
      });
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update store error:", error);
    return res.status(500).json({ message: "Failed to update store" });
  }
};

export const deleteStore = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.store.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Store not found" });
    }

    await prisma.store.delete({ where: { id } });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "DELETE",
          entity: `Store: ${existing.storeName} (${existing.platform})`
        }
      });
    }

    return res.status(200).json({ message: "Store deleted successfully" });
  } catch (error) {
    console.error("Delete store error:", error);
    return res.status(500).json({ message: "Failed to delete store" });
  }
};
