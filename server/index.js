import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import Routes
import authRouter from "./routes/auth.js";
import productsRouter from "./routes/products.js";
import storesRouter from "./routes/stores.js";
import importRouter from "./routes/import.js";
import dashboardRouter from "./routes/dashboard.js";
import exportRouter from "./routes/export.js";
import correctionsRouter from "./routes/corrections.js";
import promotionsRouter from "./routes/promotions.js";
import ordersRouter from "./routes/orders.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

// ✅ CORS - Daftar origin yang diizinkan
// Catatan: untuk debugging cepat production, kita izinkan juga mode wildcard via env.
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
  "https://sales-monitoring-yytr.vercel.app", // ← DOMAIN VERCEL MU
  "https://sales-monitoring.ae.studio",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

console.log("✅ CORS allowed origins:", allowedOrigins);

// Middleware CORS
// Catatan:
// - Di production, origin domain frontend (Vercel) bisa berbeda dari list statis.
// - Kita kembalikan header Access-Control-Allow-Origin secara dinamis untuk origin yang dikirim browser.
// - Tetap aman: hanya izinkan origin yang berasal dari daftar allowedOrigins yang kamu set.
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      // Debug mode: allow all origins if explicitly enabled
      if (process.env.CORS_ALLOW_ALL === "true") return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, origin);
      }

      console.log(`❌ CORS blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Express menangani preflight lewat middleware cors() di atas.

app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/stores", storesRouter);
app.use("/api/import", importRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/export", exportRouter);
app.use("/api/corrections", correctionsRouter);
app.use("/api/promotions", promotionsRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "commerce-insight-hub-api",
    timestamp: new Date(),
  });
});

// Error handler untuk body parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("❌ Body parsing error:", err.message);
    return res.status(400).json({
      message: "Invalid JSON payload",
      error: err.message,
    });
  }
  next(err);
});

// Centralized error handling
app.use((err, _req, res, _next) => {
  console.error("❌ Unhandled server error:", err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred on the server",
  });
});

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 API server listening on http://0.0.0.0:${port}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`✅ CORS allowed origins:`, allowedOrigins);
});
