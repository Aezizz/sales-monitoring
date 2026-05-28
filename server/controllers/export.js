import XLSX from "xlsx";
import PDFDocument from "pdfkit";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import cron from "node-cron";

const prisma = new PrismaClient();

// Helper to query orders based on filters
const queryReportData = async (filters) => {
  const { startDate, endDate, storeId, platform } = filters;
  const where = {};

  if (startDate && endDate) {
    where.orderDate = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  if (storeId) {
    where.storeId = storeId;
  }

  if (platform) {
    where.store = {
      platform: platform.toUpperCase()
    };
  }

  return await prisma.order.findMany({
    where,
    include: {
      store: true,
      product: true
    },
    orderBy: { orderDate: "desc" }
  });
};

export const exportCSV = async (req, res) => {
  try {
    const orders = await queryReportData(req.body);
    
    // Map data to CSV rows
    const headers = "Order ID,Order Date,Store,Platform,SKU,Product Name,Quantity,Total Amount,Status\n";
    const rows = orders.map((o) => {
      const dateStr = new Date(o.orderDate).toISOString().split("T")[0];
      return `"${o.orderNumber}","${dateStr}","${o.store.storeName}","${o.store.platform}","${o.product.sku}","${o.product.name.replace(/"/g, '""')}",${o.quantity},${o.totalAmount},"${o.status}"`;
    }).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="orders_report.csv"');
    return res.status(200).send(headers + rows);
  } catch (error) {
    console.error("Export CSV error:", error);
    return res.status(500).json({ message: "Failed to export CSV" });
  }
};

export const exportXLSX = async (req, res) => {
  try {
    const orders = await queryReportData(req.body);
    
    // Format JSON array
    const data = orders.map((o) => ({
      "Order ID": o.orderNumber,
      "Order Date": new Date(o.orderDate).toISOString().split("T")[0],
      "Store Name": o.store.storeName,
      "Platform": o.store.platform,
      "SKU": o.product.sku,
      "Product Name": o.product.name,
      "Quantity": o.quantity,
      "Total Amount": o.totalAmount,
      "Status": o.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders Sales Report");

    // Adjust column widths automatically
    const maxColumnWidths = {};
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        const val = String(row[key] || "");
        maxColumnWidths[key] = Math.max(maxColumnWidths[key] || 10, val.length);
      });
    });
    worksheet["!cols"] = Object.keys(maxColumnWidths).map(key => ({
      wch: maxColumnWidths[key] + 3
    }));

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="orders_report.xlsx"');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Export XLSX error:", error);
    return res.status(500).json({ message: "Failed to export XLSX" });
  }
};

export const exportPDF = async (req, res) => {
  try {
    const orders = await queryReportData(req.body);
    
    // Calculate statistics
    const totalOrders = orders.length;
    const gmv = orders.reduce((sum, o) => sum + (o.status !== "Cancelled" ? o.totalAmount : 0), 0);
    const totalQty = orders.reduce((sum, o) => sum + o.quantity, 0);

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="orders_report.pdf"');
    doc.pipe(res);

    // Title / Header
    doc.fillColor("#1F2937").fontSize(22).text("Commerce Insight Hub", { align: "left" });
    doc.fontSize(10).fillColor("#FF7A00").text("SALES SUMMARY & AUDIT REPORT", { align: "left" });
    doc.moveDown();

    // Horizontal Rule
    doc.moveTo(50, 100).lineTo(550, 100).strokeColor("#E5E7EB").lineWidth(1).stroke();
    doc.moveDown(2);

    // Metrics Grid Box
    doc.fillColor("#1F2937").fontSize(12).text(`Report Generated On: ${new Date().toLocaleString()}`, { align: "right" });
    doc.moveDown();

    // Summary Section
    doc.fillColor("#1F2937").fontSize(14).text("Summary Indicators", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Total GMV: Rp ${gmv.toLocaleString("id-ID")}`);
    doc.text(`Total Orders: ${totalOrders}`);
    doc.text(`Items Sold: ${totalQty}`);
    doc.moveDown(2);

    // Draw Orders Table
    doc.fontSize(14).text("Order Lines Detail", { underline: true });
    doc.moveDown(0.5);

    // Table Header
    doc.fontSize(10).fillColor("#FF7A00");
    const yHeader = doc.y;
    doc.text("Order ID", 50, yHeader, { width: 100 });
    doc.text("Platform", 150, yHeader, { width: 80 });
    doc.text("SKU", 230, yHeader, { width: 90 });
    doc.text("Qty", 320, yHeader, { width: 30, align: "right" });
    doc.text("Total Amount", 360, yHeader, { width: 100, align: "right" });
    doc.text("Status", 470, yHeader, { width: 80, align: "right" });
    doc.moveDown(0.5);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#334155").lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    doc.fillColor("#1F2937");
    // Row iteration
    orders.slice(0, 25).forEach((o) => {
      // Check page break
      if (doc.y > 700) {
        doc.addPage();
        doc.fillColor("#FF7A00").fontSize(10);
        doc.text("Order ID", 50, 50, { width: 100 });
        doc.text("Platform", 150, 50, { width: 80 });
        doc.text("SKU", 230, 50, { width: 90 });
        doc.text("Qty", 320, 50, { width: 30, align: "right" });
        doc.text("Total Amount", 360, 50, { width: 100, align: "right" });
        doc.text("Status", 470, 50, { width: 80, align: "right" });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#334155").lineWidth(0.5).stroke();
        doc.moveDown(0.5);
        doc.fillColor("#1F2937");
      }

      const yRow = doc.y;
      doc.text(o.orderNumber, 50, yRow, { width: 100, lineBreak: false });
      doc.text(o.store.platform, 150, yRow, { width: 80, lineBreak: false });
      doc.text(o.product.sku, 230, yRow, { width: 90, lineBreak: false });
      doc.text(String(o.quantity), 320, yRow, { width: 30, align: "right", lineBreak: false });
      doc.text(`Rp ${o.totalAmount.toLocaleString("id-ID")}`, 360, yRow, { width: 100, align: "right", lineBreak: false });
      doc.text(o.status, 470, yRow, { width: 80, align: "right", lineBreak: false });
      doc.moveDown(0.8);
    });

    if (orders.length > 25) {
      doc.moveDown();
      doc.fontSize(9).fillColor("#9CA3AF").text(`... and ${orders.length - 25} other orders are omitted from this PDF view. Please export to CSV/Excel for the full records.`, { align: "center" });
    }

    doc.end();
  } catch (error) {
    console.error("Export PDF error:", error);
    return res.status(500).json({ message: "Failed to export PDF" });
  }
};

// Scheduler Storage & Implementation (Memory mapped config for simple deployment)
let activeReportJobs = {};

export const scheduleReport = async (req, res) => {
  const { frequency, email, platform, storeId } = req.body; // frequency: "daily", "weekly", "monthly"

  if (!frequency || !email) {
    return res.status(400).json({ message: "Frequency and recipient email are required" });
  }

  try {
    // Generate cron expression
    let cronExpr;
    if (frequency === "daily") {
      cronExpr = "0 8 * * *"; // Every day at 08:00 AM
    } else if (frequency === "weekly") {
      cronExpr = "0 8 * * 1"; // Every Monday at 08:00 AM
    } else {
      cronExpr = "0 8 1 * *"; // Every 1st day of month at 08:00 AM
    }

    // Cancel existing job if exists for this email
    if (activeReportJobs[email]) {
      activeReportJobs[email].stop();
    }

    // Define cron task
    const task = cron.schedule(cronExpr, async () => {
      console.log(`[cron] Running scheduled report delivery for ${email}...`);
      try {
        // Calculate date filters based on frequency
        const endDate = new Date();
        const startDate = new Date();
        if (frequency === "daily") startDate.setDate(endDate.getDate() - 1);
        else if (frequency === "weekly") startDate.setDate(endDate.getDate() - 7);
        else startDate.setMonth(endDate.getMonth() - 1);

        const orders = await queryReportData({
          startDate,
          endDate,
          storeId,
          platform
        });

        // 1. Create simple Excel attachment
        const data = orders.map((o) => ({
          "Order ID": o.orderNumber,
          "Order Date": new Date(o.orderDate).toISOString().split("T")[0],
          "Store Name": o.store.storeName,
          "Platform": o.store.platform,
          "SKU": o.product.sku,
          "Product Name": o.product.name,
          "Quantity": o.quantity,
          "Total Amount": o.totalAmount,
          "Status": o.status
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");
        const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        // 2. Setup mail transporter
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || "smtp.mailtrap.io",
          port: Number(process.env.EMAIL_PORT) || 2525,
          auth: {
            user: process.env.EMAIL_USER || "",
            pass: process.env.EMAIL_PASS || ""
          }
        });

        await transporter.sendMail({
          from: '"Commerce Insight Hub" <reports@insight.com>',
          to: email,
          subject: `Scheduled ${frequency.toUpperCase()} Sales Report`,
          text: `Halo, terlampir adalah laporan penjualan berkala Anda (${frequency}) dari tanggal ${startDate.toLocaleDateString()} hingga ${endDate.toLocaleDateString()}.\n\nTotal Orders: ${orders.length}\nTotal Revenue: Rp ${orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString("id-ID")}\n\nSalam,\nTeam Commerce Insight Hub`,
          attachments: [
            {
              filename: `sales_report_${frequency}_${Date.now()}.xlsx`,
              content: xlsxBuffer
            }
          ]
        });

        console.log(`[cron] Email sent successfully to ${email}`);
      } catch (err) {
        console.error(`[cron] Error sending scheduled report to ${email}:`, err);
      }
    });

    activeReportJobs[email] = task;

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "SCHEDULE",
          entity: `Scheduled ${frequency} report configuration for ${email}`
        }
      });
    }

    return res.status(200).json({
      message: `Successfully scheduled ${frequency} reports. Delivery will start on next schedule.`,
      recipient: email
    });
  } catch (error) {
    console.error("Schedule report error:", error);
    return res.status(500).json({ message: "Failed to schedule report" });
  }
};
