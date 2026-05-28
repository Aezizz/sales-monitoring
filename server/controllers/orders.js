import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllOrders = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? {
          orderNumber: { contains: search },
        }
      : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { product: true, store: true },
        orderBy: { orderDate: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where }),
    ]);

    return res.status(200).json({
      orders,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, totalAmount, status } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(totalAmount !== undefined && { totalAmount: Number(totalAmount) }),
        ...(status && { status }),
      },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "UPDATE_ORDER",
          entity: `Order ID: ${order.orderNumber}`,
        },
      });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Update order error:", error);
    return res.status(500).json({ message: "Failed to update order" });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Menghapus corrections yang berelasi karena tidak ada onDelete: Cascade
    await prisma.correction.deleteMany({
      where: { orderId: id },
    });

    const order = await prisma.order.delete({
      where: { id },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "DELETE_ORDER",
          entity: `Deleted Order ID: ${order.orderNumber}`,
        },
      });
    }

    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error);
    return res.status(500).json({ message: "Failed to delete order" });
  }
};
