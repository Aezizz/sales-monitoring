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
const clientUrl = process.env.CLIENT_URL ?? "http://127.0.0.1:5173";

// Middleware
app.use(cors({ origin: [clientUrl, "http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json());

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
    timestamp: new Date()
  });
});

// Centralized error handling
app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred on the server"
  });
});

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`API server listening on http://0.0.0.0:${port}`);
});
