import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("❌ JWT_SECRET is not set on server (verify)");
      return res
        .status(500)
        .json({ message: "Server misconfigured (JWT_SECRET missing)" });
    }

    const decoded = jwt.verify(token, secret);

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: This action requires one of roles: [${allowedRoles.join(", ")}]`,
      });
    }

    next();
  };
};
