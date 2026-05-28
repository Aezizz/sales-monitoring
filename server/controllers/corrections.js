import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getCorrections = async (req, res) => {
  try {
    const corrections = await prisma.correction.findMany({
      include: {
        order: {
          include: {
            store: true,
            product: true
          }
        },
        requester: {
          select: { name: true, email: true, role: true }
        },
        approver: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.status(200).json(corrections);
  } catch (error) {
    console.error("Get corrections error:", error);
    return res.status(500).json({ message: "Failed to fetch corrections list" });
  }
};

export const createCorrectionRequest = async (req, res) => {
  const { orderId, orderNumber, reason, proposedStatus } = req.body;

  if (!orderId && !orderNumber) {
    return res.status(400).json({ message: "Order ID or Order Number is required" });
  }

  if (!reason) {
    return res.status(400).json({ message: "Reason is required" });
  }

  try {
    let order;
    if (orderId) {
      order = await prisma.order.findUnique({ where: { id: orderId } });
    } else {
      order = await prisma.order.findUnique({ where: { orderNumber } });
    }

    if (!order) {
      return res.status(404).json({ message: "Target order not found" });
    }

    // Append proposedStatus to reason if provided to keep schema clean
    const formattedReason = proposedStatus 
      ? `[Proposed Status: ${proposedStatus}] ${reason}`
      : reason;

    const correction = await prisma.correction.create({
      data: {
        orderId: order.id,
        requestedBy: req.user.id,
        reason: formattedReason,
        status: "PENDING"
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: "REQUEST_CORRECTION",
        entity: `Correction requested for Order ID ${order.orderNumber}`
      }
    });


    return res.status(201).json(correction);
  } catch (error) {
    console.error("Create correction error:", error);
    return res.status(500).json({ message: "Failed to submit correction request" });
  }
};

export const approveCorrection = async (req, res) => {
  const { id } = req.params;

  try {
    const correction = await prisma.correction.findUnique({
      where: { id },
      include: { order: true }
    });

    if (!correction) {
      return res.status(404).json({ message: "Correction request not found" });
    }

    if (correction.status !== "PENDING") {
      return res.status(400).json({ message: "This request has already been processed" });
    }

    // Parse proposed changes if applicable
    // Simple parser: check if reason starts with "[Proposed Status: XXX]"
    let statusUpdate = {};
    const match = correction.reason.match(/^\[Proposed Status:\s*([^\]]+)\]/);
    if (match && match[1]) {
      statusUpdate = { status: match[1].trim() };
    }

    // Process order update and correction status update inside transaction
    await prisma.$transaction([
      prisma.correction.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedBy: req.user.id
        }
      }),
      // Apply status updates to the order
      ...(Object.keys(statusUpdate).length > 0
        ? [
            prisma.order.update({
              where: { id: correction.orderId },
              data: statusUpdate
            })
          ]
        : [])
    ]);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: "APPROVE_CORRECTION",
        entity: `Correction ID ${id} APPROVED for Order ${correction.order.orderNumber}`
      }
    });

    return res.status(200).json({ message: "Correction request approved successfully" });
  } catch (error) {
    console.error("Approve correction error:", error);
    return res.status(500).json({ message: "Failed to approve correction" });
  }
};

export const rejectCorrection = async (req, res) => {
  const { id } = req.params;

  try {
    const correction = await prisma.correction.findUnique({
      where: { id },
      include: { order: true }
    });

    if (!correction) {
      return res.status(404).json({ message: "Correction request not found" });
    }

    if (correction.status !== "PENDING") {
      return res.status(400).json({ message: "This request has already been processed" });
    }

    await prisma.correction.update({
      where: { id },
      data: {
        status: "REJECTED",
        approvedBy: req.user.id
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: "REJECT_CORRECTION",
        entity: `Correction ID ${id} REJECTED for Order ${correction.order.orderNumber}`
      }
    });

    return res.status(200).json({ message: "Correction request rejected successfully" });
  } catch (error) {
    console.error("Reject correction error:", error);
    return res.status(500).json({ message: "Failed to reject correction" });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.status(200).json(logs);
  } catch (error) {
    console.error("Get audit logs error:", error);
    return res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};
