import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getPromotions = async (req, res) => {
  try {
    const promos = await prisma.promotion.findMany({
      orderBy: { startDate: "desc" }
    });
    return res.status(200).json(promos);
  } catch (error) {
    console.error("Get promotions error:", error);
    return res.status(500).json({ message: "Failed to fetch promotions" });
  }
};

export const createPromotion = async (req, res) => {
  const { name, platform, startDate, endDate, budget, revenue } = req.body;

  if (!name || !platform || !startDate || !endDate || budget === undefined || revenue === undefined) {
    return res.status(400).json({ message: "All promotion fields are required" });
  }

  try {
    const promo = await prisma.promotion.create({
      data: {
        name,
        platform,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget: Number(budget),
        revenue: Number(revenue)
      }
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "CREATE",
          entity: `Promotion: ${promo.name} (${promo.platform})`
        }
      });
    }

    return res.status(201).json(promo);
  } catch (error) {
    console.error("Create promotion error:", error);
    return res.status(500).json({ message: "Failed to create promotion" });
  }
};

export const updatePromotion = async (req, res) => {
  const { id } = req.params;
  const { name, platform, startDate, endDate, budget, revenue } = req.body;

  try {
    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    const updated = await prisma.promotion.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        platform: platform !== undefined ? platform : existing.platform,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate ? new Date(endDate) : existing.endDate,
        budget: budget !== undefined ? Number(budget) : existing.budget,
        revenue: revenue !== undefined ? Number(revenue) : existing.revenue
      }
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "UPDATE",
          entity: `Promotion: ${updated.name} (${updated.platform})`
        }
      });
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update promotion error:", error);
    return res.status(500).json({ message: "Failed to update promotion" });
  }
};

export const deletePromotion = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    await prisma.promotion.delete({ where: { id } });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "DELETE",
          entity: `Promotion: ${existing.name} (${existing.platform})`
        }
      });
    }

    return res.status(200).json({ message: "Promotion deleted successfully" });
  } catch (error) {
    console.error("Delete promotion error:", error);
    return res.status(500).json({ message: "Failed to delete promotion" });
  }
};

export const getPromotionsAnalytics = async (req, res) => {
  try {
    const promos = await prisma.promotion.findMany();

    const totalBudget = promos.reduce((sum, p) => sum + p.budget, 0);
    const totalRevenue = promos.reduce((sum, p) => sum + p.revenue, 0);
    const totalROI = totalBudget > 0 ? totalRevenue / totalBudget : 0;

    const platformBreakdown = {};
    promos.forEach((p) => {
      const plat = p.platform.toUpperCase();
      if (!platformBreakdown[plat]) {
        platformBreakdown[plat] = { platform: p.platform, budget: 0, revenue: 0, count: 0 };
      }
      platformBreakdown[plat].budget += p.budget;
      platformBreakdown[plat].revenue += p.revenue;
      platformBreakdown[plat].count += 1;
    });

    const breakdown = Object.values(platformBreakdown).map((b) => {
      const roi = b.budget > 0 ? b.revenue / b.budget : 0;
      return {
        ...b,
        roi: Math.round(roi * 100) / 100
      };
    });

    return res.status(200).json({
      summary: {
        totalBudget,
        totalRevenue,
        roi: Math.round(totalROI * 100) / 100,
        campaignsCount: promos.length
      },
      breakdown,
      campaignsDetail: promos.map((p) => {
        const roi = p.budget > 0 ? p.revenue / p.budget : 0;
        return {
          ...p,
          roi: Math.round(roi * 100) / 100
        };
      })
    });
  } catch (error) {
    console.error("Promotions analytics error:", error);
    return res.status(500).json({ message: "Failed to fetch promotions analytics" });
  }
};
