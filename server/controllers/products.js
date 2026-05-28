import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: true
      },
      orderBy: { createdAt: "desc" }
    });

    // Calculate margins for monitoring
    const productsWithMargin = products.map((prod) => {
      const sell = Number(prod.sellPrice);
      const cost = Number(prod.costPrice);
      const marginAmount = sell - cost;
      const marginPercent = sell > 0 ? (marginAmount / sell) * 100 : 0;
      return {
        ...prod,
        marginAmount,
        marginPercent: Math.round(marginPercent * 100) / 100
      };
    });

    return res.status(200).json(productsWithMargin);
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
};

export const createProduct = async (req, res) => {
  const { sku, parentSku, name, category, image, costPrice, sellPrice, variants } = req.body;

  if (!sku || !name || costPrice === undefined || sellPrice === undefined) {
    return res.status(400).json({ message: "SKU, name, cost price, and sell price are required" });
  }

  try {
    // Check duplicate SKU
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return res.status(400).json({ message: `Product SKU ${sku} already exists` });
    }

    // Prepare variants data
    const variantsList = Array.isArray(variants) ? variants : [];

    const product = await prisma.product.create({
      data: {
        sku,
        parentSku: parentSku || null,
        name,
        category: category || "General",
        image: image || null,
        costPrice: Number(costPrice),
        sellPrice: Number(sellPrice),
        variants: {
          create: variantsList.map((v) => ({
            variantName: v.variantName,
            stock: Number(v.stock ?? 0)
          }))
        }
      },
      include: {
        variants: true
      }
    });

    // Audit Log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "CREATE",
          entity: `Product: ${product.name} (${product.sku})`
        }
      });
    }

    return res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({ message: "Failed to create product" });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { sku, parentSku, name, category, image, costPrice, sellPrice, variants } = req.body;

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { variants: true }
    });

    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check duplicate SKU if it has changed
    if (sku && sku !== existing.sku) {
      const duplicate = await prisma.product.findUnique({ where: { sku } });
      if (duplicate) {
        return res.status(400).json({ message: `SKU ${sku} is already assigned to another product` });
      }
    }

    // If variants are supplied, sync them (delete removed ones, upsert remaining)
    if (Array.isArray(variants)) {
      // Simple sync: delete all existing variants for this product and create the new set
      await prisma.productVariant.deleteMany({
        where: { productId: id }
      });

      await prisma.productVariant.createMany({
        data: variants.map((v) => ({
          productId: id,
          variantName: v.variantName,
          stock: Number(v.stock ?? 0)
        }))
      });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        sku: sku !== undefined ? sku : existing.sku,
        parentSku: parentSku !== undefined ? parentSku : existing.parentSku,
        name: name !== undefined ? name : existing.name,
        category: category !== undefined ? category : existing.category,
        image: image !== undefined ? image : existing.image,
        costPrice: costPrice !== undefined ? Number(costPrice) : existing.costPrice,
        sellPrice: sellPrice !== undefined ? Number(sellPrice) : existing.sellPrice
      },
      include: {
        variants: true
      }
    });

    // Audit Log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "UPDATE",
          entity: `Product: ${updated.name} (${updated.sku})`
        }
      });
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({ message: "Failed to update product" });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    await prisma.product.delete({
      where: { id }
    });

    // Audit Log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "DELETE",
          entity: `Product: ${existing.name} (${existing.sku})`
        }
      });
    }

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({ message: "Failed to delete product" });
  }
};
