import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const toDateRangeWhere = (startDate, endDate) => {
  if (!startDate || !endDate) return {};
  // Treat dates as local calendar days (YYYY-MM-DD) to avoid UTC off-by-one.
  // Use end exclusive: < endDate + 1 day
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setDate(end.getDate() + 1);
  return {
    orderDate: {
      gte: start,
      lt: end,
    },
  };
};

const isCompleted = (status) => String(status).toLowerCase() === "completed";

export const getDashboardSummary = async (req, res) => {
  const { startDate, endDate, storeId, platform } = req.query;

  try {
    // Build filters
    const where = {
      ...toDateRangeWhere(startDate, endDate),
    };

    if (storeId) where.storeId = storeId;
    if (platform) where.store = { platform: platform.toUpperCase() };

    const orders = await prisma.order.findMany({
      where,
      include: {
        product: true,
        store: true,
      },
    });

    // Only Completed orders are counted for operational KPIs.
    const completedOrders = orders.filter((o) => isCompleted(o.status));

    const totalOrders = completedOrders.length;
    const itemsSold = completedOrders.reduce((sum, o) => sum + o.quantity, 0);
    const gmv = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const refundOrders = orders.filter((o) => {
      const s = String(o.status).toLowerCase();
      return s === "refunded" || s === "returned";
    });
    const refundAmount = refundOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0,
    );

    const aov = totalOrders > 0 ? gmv / totalOrders : 0;

    const conversionRate = totalOrders > 0 ? 2.85 : 0; // mock benchmark target

    const recentActivityLogs = await prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    const recentActivities = recentActivityLogs.map((log) => ({
      id: log.id,
      type: log.action,
      entity: log.entity,
      user: log.user.name,
      createdAt: log.createdAt,
    }));

    return res.status(200).json({
      kpis: {
        gmv,
        totalOrders,
        itemsSold,
        refundAmount,
        conversionRate,
        aov,
      },
      recentActivities,
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch dashboard summary" });
  }
};

export const getDashboardTrends = async (req, res) => {
  const {
    startDate,
    endDate,
    storeId,
    platform,
    viewMode = "daily",
  } = req.query;

  try {
    const where = {
      ...toDateRangeWhere(startDate, endDate),
    };

    if (storeId) where.storeId = storeId;
    if (platform) where.store = { platform: platform.toUpperCase() };

    // Trends: only completed orders contribute to sales and order count
    const orders = await prisma.order.findMany({
      where: {
        ...where,
        status: "Completed",
      },
      orderBy: { orderDate: "asc" },
    });

    const trendMap = {};

    orders.forEach((o) => {
      const d = new Date(o.orderDate);
      let key;

      if (viewMode === "monthly") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else if (viewMode === "weekly") {
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear =
          (d.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil(
          (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7,
        );
        key = `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
      } else {
        key = d.toISOString().split("T")[0];
      }

      if (!trendMap[key]) {
        trendMap[key] = { date: key, sales: 0, orders: 0 };
      }
      trendMap[key].sales += o.totalAmount;
      trendMap[key].orders += 1;
    });

    return res.status(200).json(Object.values(trendMap));
  } catch (error) {
    console.error("Dashboard trends error:", error);
    return res.status(500).json({ message: "Failed to fetch sales trends" });
  }
};

export const getDashboardTopProducts = async (req, res) => {
  const { startDate, endDate, storeId, platform } = req.query;

  try {
    const where = {
      ...toDateRangeWhere(startDate, endDate),
    };

    if (storeId) where.storeId = storeId;
    if (platform) where.store = { platform: platform.toUpperCase() };

    // Top products: only completed orders contribute to revenue and units
    const orders = await prisma.order.findMany({
      where: {
        ...where,
        status: "Completed",
      },
      include: {
        product: true,
      },
    });

    const productStats = {};

    orders.forEach((o) => {
      const prod = o.product;
      if (!productStats[prod.id]) {
        productStats[prod.id] = {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          unitsSold: 0,
          revenue: 0,
          growth: 8.5, // mock comparison
        };
      }
      productStats[prod.id].unitsSold += o.quantity;
      productStats[prod.id].revenue += o.totalAmount;
    });

    const sortedProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return res.status(200).json(sortedProducts);
  } catch (error) {
    console.error("Dashboard top products error:", error);
    return res.status(500).json({ message: "Failed to fetch top products" });
  }
};

export const getDashboardPlatformComparison = async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const where = {
      ...toDateRangeWhere(startDate, endDate),
    };

    // We need both completed and refund statuses.
    const orders = await prisma.order.findMany({
      where,
      include: {
        store: true,
      },
    });

    const platformStats = {
      SHOPEE: { platform: "Shopee", revenue: 0, orders: 0, refunds: 0 },
      TIKTOK: { platform: "TikTok Shop", revenue: 0, orders: 0, refunds: 0 },
    };

    orders.forEach((o) => {
      const plat = o.store.platform;
      if (!platformStats[plat]) return;

      // Count orders/revenue only for completed
      if (isCompleted(o.status)) {
        platformStats[plat].orders += 1;
        platformStats[plat].revenue += o.totalAmount;
        return;
      }

      // Refund totals
      const s = String(o.status).toLowerCase();
      if (s === "refunded" || s === "returned") {
        platformStats[plat].refunds += o.totalAmount;
      }
    });

    const comparison = Object.values(platformStats).map((stats) => {
      const refundRate =
        stats.revenue > 0 ? (stats.refunds / stats.revenue) * 100 : 0;
      return {
        ...stats,
        refundRate: Math.round(refundRate * 100) / 100,
        conversion: stats.orders > 0 ? 2.9 : 0,
      };
    });

    return res.status(200).json(comparison);
  } catch (error) {
    console.error("Platform comparison error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch platform comparisons" });
  }
};
