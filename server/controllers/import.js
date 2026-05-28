import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to auto-detect mappings
const autoDetectMapping = (headers) => {
  const mapping = {
    orderNumber: "",
    sku: "",
    quantity: "",
    totalAmount: "",
    status: "",
    orderDate: "",
  };

  const clean = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, "");

  headers.forEach((h) => {
    const norm = clean(h);

    // Order number
    if (
      norm.includes("orderid") ||
      norm.includes("nopesanan") ||
      norm.includes("ordernumber") ||
      norm.includes("noinvoice") ||
      norm.includes("invoice")
    ) {
      mapping.orderNumber = h;
    }
    // SKU
    else if (
      norm.includes("sku") ||
      norm.includes("koderef") ||
      norm.includes("partnumber") ||
      norm.includes("productsku")
    ) {
      mapping.sku = h;
    }
    // Quantity
    else if (
      norm.includes("qty") ||
      norm.includes("quantity") ||
      norm.includes("jumlah") ||
      norm.includes("pcs")
    ) {
      mapping.quantity = h;
    }
    // Total Amount
    else if (
      norm.includes("amount") ||
      norm.includes("total") ||
      norm.includes("harga") ||
      norm.includes("revenue") ||
      norm.includes("bayar") ||
      norm.includes("price")
    ) {
      if (!mapping.totalAmount) mapping.totalAmount = h; // preference for total amount
    }
    // Status
    else if (norm.includes("status") || norm.includes("state")) {
      mapping.status = h;
    }
    // Order Date
    else if (
      norm.includes("date") ||
      norm.includes("time") ||
      norm.includes("tanggal") ||
      norm.includes("created")
    ) {
      mapping.orderDate = h;
    }
  });

  return mapping;
};

// Step 1: Upload and get spreadsheet headers & sample
export const analyzeFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read raw rows
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    if (rows.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "The uploaded file is empty" });
    }

    const headers = rows[0].map((h) => String(h).trim()).filter(Boolean);
    const sampleRow = rows.length > 1 ? rows[1] : [];

    // Map headers to sample values
    const sample = {};
    headers.forEach((h, idx) => {
      sample[h] = sampleRow[idx] !== undefined ? sampleRow[idx] : "";
    });

    const detectedMapping = autoDetectMapping(headers);

    return res.status(200).json({
      filePath: req.file.filename, // return just filename for safety
      originalName: req.file.originalname,
      headers,
      sample,
      detectedMapping,
    });
  } catch (error) {
    console.error("Analyze file error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ message: "Failed to analyze file" });
  }
};

// Step 2: Process the imported file rows
export const processImport = async (req, res) => {
  const { fileName, storeId, mapping } = req.body;

  if (!fileName || !storeId || !mapping) {
    return res
      .status(400)
      .json({ message: "fileName, storeId, and mapping are required" });
  }

  const filePath = path.join("server/uploads", fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Temporary upload file not found" });
  }

  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return res.status(404).json({ message: "Selected store not found" });
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON array of objects using headers
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // Load master products for SKU validation
    const productsList = await prisma.product.findMany();
    const productMap = new Map(
      productsList.map((p) => [p.sku.toLowerCase(), p]),
    );

    const failedRows = [];
    const validOrdersData = [];
    let totalRows = rawRows.length;

    // Check duplicate order numbers already in db to avoid database constraint failures
    const existingOrders = await prisma.order.findMany({
      select: { orderNumber: true },
    });
    const existingOrderNums = new Set(
      existingOrders.map((o) => o.orderNumber.toLowerCase()),
    );

    // Set of order numbers in the current import sheet to check for sheet-level duplicates
    const currentImportOrderNums = new Set();

    for (let idx = 0; idx < rawRows.length; idx++) {
      const row = rawRows[idx];
      const rowNum = idx + 2; // spreadsheet line is 1-indexed, header is row 1

      const orderNumberVal = String(row[mapping.orderNumber] || "").trim();
      const skuVal = String(row[mapping.sku] || "").trim();
      const qtyVal = Number(row[mapping.quantity]);
      const totalAmountVal = Number(row[mapping.totalAmount]);
      const statusVal = String(row[mapping.status] || "Completed").trim();
      const dateValRaw = row[mapping.orderDate];

      const validationErrors = [];

      // 1. Missing value check
      if (!orderNumberVal) validationErrors.push("Order Number is missing");
      if (!skuVal) validationErrors.push("SKU is missing");
      if (isNaN(qtyVal) || qtyVal <= 0)
        validationErrors.push("Quantity must be a positive integer");
      if (isNaN(totalAmountVal) || totalAmountVal < 0)
        validationErrors.push("Total Amount must be a valid number");
      if (!dateValRaw) validationErrors.push("Order Date is missing");

      // 2. Parse Date
      let orderDate;
      if (dateValRaw) {
        // If Excel numeric date
        if (typeof dateValRaw === "number") {
          // Convert Excel serial date
          orderDate = new Date((dateValRaw - 25569) * 86400 * 1000);
        } else {
          orderDate = new Date(dateValRaw);
        }

        if (isNaN(orderDate.getTime())) {
          validationErrors.push(`Invalid date format: ${dateValRaw}`);
        }
      }

      // 3. Check SKU in database
      const matchedProduct = productMap.get(skuVal.toLowerCase());
      if (skuVal && !matchedProduct) {
        validationErrors.push(
          `SKU '${skuVal}' does not exist in Master Products`,
        );
      }

      // 4. Check database-level duplicate orderNumber
      if (orderNumberVal) {
        if (existingOrderNums.has(orderNumberVal.toLowerCase())) {
          validationErrors.push(
            `Order ID '${orderNumberVal}' already exists in database`,
          );
        }
        // 5. Check sheet-level duplicate orderNumber
        if (currentImportOrderNums.has(orderNumberVal.toLowerCase())) {
          validationErrors.push(
            `Duplicate Order ID '${orderNumberVal}' in upload sheet`,
          );
        }
      }

      if (validationErrors.length > 0) {
        failedRows.push({
          row: rowNum,
          orderNumber: orderNumberVal || "N/A",
          sku: skuVal || "N/A",
          errors: validationErrors.join(", "),
        });
      } else {
        currentImportOrderNums.add(orderNumberVal.toLowerCase());
        validOrdersData.push({
          orderNumber: orderNumberVal,
          storeId,
          productId: matchedProduct.id,
          quantity: Math.floor(qtyVal),
          totalAmount: totalAmountVal,
          status: statusVal,
          orderDate,
        });
      }
    }

    // Database writes inside a transaction (createMany for performance)
    if (validOrdersData.length > 0) {
      // prisma.order.orderNumber is unique; we already filtered duplicates, but
      // in case of races we use skipDuplicates.
      await prisma.$transaction(async (tx) => {
        await tx.order.createMany({
          data: validOrdersData,
          skipDuplicates: true,
        });
      });
    }

    // Save Import History
    const status =
      failedRows.length === 0
        ? "SUCCESS"
        : validOrdersData.length === 0
          ? "FAILED"
          : "PARTIAL";

    const history = await prisma.importHistory.create({
      data: {
        filename: fileName,
        status,
        uploadedBy: req.user ? req.user.name : "Staff",
        totalRows,
        failedRows: failedRows.length,
      },
    });

    // Audit log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "IMPORT",
          entity: `Import filename: ${fileName} (${status}) - Successful: ${validOrdersData.length}, Failed: ${failedRows.length}`,
        },
      });
    }

    // Clean up temporary file
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn("Could not delete file after processing:", e.message);
    }

    return res.status(200).json({
      message: `Import processed. Successfully imported: ${validOrdersData.length} orders. Failed: ${failedRows.length} rows.`,
      history,
      failedRows,
    });
  } catch (error) {
    console.error("Process import error:", error);
    // Cleanup on crash
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (_) {}
    }
    return res.status(500).json({ message: "Failed to process import" });
  }
};

export const getImportHistory = async (req, res) => {
  try {
    const history = await prisma.importHistory.findMany({
      orderBy: { timestamp: "desc" },
    });
    return res.status(200).json(history);
  } catch (error) {
    console.error("Get import history error:", error);
    return res.status(500).json({ message: "Failed to fetch import history" });
  }
};
