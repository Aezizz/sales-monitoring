import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt for:", email);

    // Validasi input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Cari user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log("❌ Invalid password for:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("❌ JWT_SECRET is not set on server");
      return res
        .status(500)
        .json({ message: "Server misconfigured (JWT_SECRET missing)" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: "7d" },
    );

    console.log("✅ Login successful for:", email);

    // Return response (jangan kirim password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Cek user existing
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "VIEWER",
      },
    });

    // Generate token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("❌ JWT_SECRET is not set on server");
      return res
        .status(500)
        .json({ message: "Server misconfigured (JWT_SECRET missing)" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: "7d" },
    );

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: "Registration successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("❌ GetMe error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
