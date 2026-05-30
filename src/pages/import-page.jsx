import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/http.js";
import { Button } from "@/shared/components/ui/button.jsx";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Database,
  Eye,
  History,
} from "lucide-react";

export default function ImportPage() {
  const queryClient = useQueryClient();

  // Selected file and step
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadStep, setUploadStep] = useState("select"); // select -> mapping -> processing -> result

  // Analysis result
  const [analysis, setAnalysis] = useState(null); // { filePath, headers, sample, detectedMapping }
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [mapping, setMapping] = useState({}); // { systemField: excelHeader }

  // Import results
  const [importResult, setImportResult] = useState(null); // { message, history, failedRows }

  // Fetch active stores
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: () => apiRequest("/stores"),
  });

  // Fetch import history
  const { data: history = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ["import-history"],
    queryFn: () => apiRequest("/import/history"),
  });

  // Mutations
  // (analyzeMutation di-left untuk versi sebelumnya; saat ini analisis dipanggil via runAnalyzeFile + apiRequest)

  // Custom upload mutation that works with fetch FormData
  const runAnalyzeFile = async (selectedFile) => {
    setUploadStep("processing");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await apiRequest("/import/analyze", {
        method: "POST",
        body: formData,
        headers: {
          // fetch auto-set multipart boundary
          "Content-Type": undefined,
          ...headers,
        },
      });

      setAnalysis(response);
      setMapping(response.detectedMapping);
      setUploadStep("mapping");
    } catch (err) {
      setErrorMsg(err.message);
      setUploadStep("select");
    }
  };

  const processMutation = useMutation({
    mutationFn: (payload) =>
      apiRequest("/import/process", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setImportResult(data);
      setUploadStep("result");
      queryClient.invalidateQueries(["import-history"]);
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to process import");
      setUploadStep("mapping");
    },
  });

  // Drag Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setErrorMsg("");
    const ext = file.name.split(".").pop().toLowerCase();
    const validExtensions = ["csv", "xlsx", "xls"];

    if (!validExtensions.includes(ext)) {
      setErrorMsg(
        "Format file tidak didukung. Harap upload file CSV atau Excel (.xlsx, .xls)",
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File terlalu besar. Batas ukuran maksimal adalah 10MB");
      return;
    }

    setFile(file);
    runAnalyzeFile(file);
  };

  const handleMappingChange = (systemField, selectedHeader) => {
    setMapping((prev) => ({
      ...prev,
      [systemField]: selectedHeader,
    }));
  };

  const handleStartImport = () => {
    setErrorMsg("");
    if (!selectedStoreId) {
      setErrorMsg("Silakan pilih Store tujuan import");
      return;
    }

    // Verify all fields are mapped
    const requiredFields = [
      "orderNumber",
      "sku",
      "quantity",
      "totalAmount",
      "orderDate",
    ];
    const unmapped = requiredFields.filter((f) => !mapping[f]);
    if (unmapped.length > 0) {
      setErrorMsg(
        `Semua kolom wajib harus di-map. Kolom tersisa: [${unmapped.join(", ")}]`,
      );
      return;
    }

    processMutation.mutate({
      fileName: analysis.filePath,
      storeId: selectedStoreId,
      mapping,
    });
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setMapping({});
    setSelectedStoreId("");
    setImportResult(null);
    setUploadStep("select");
    setErrorMsg("");
  };

  const systemFields = [
    { key: "orderNumber", label: "No. Pesanan / Order ID", required: true },
    { key: "sku", label: "SKU Produk", required: true },
    { key: "quantity", label: "Jumlah / Quantity", required: true },
    { key: "totalAmount", label: "Total Pembayaran (Revenue)", required: true },
    { key: "orderDate", label: "Tanggal Pesanan", required: true },
    { key: "status", label: "Status Pesanan", required: false },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Import Data Marketplace
        </h2>
        <p className="text-sm text-muted-foreground">
          Unggah data spreadsheet penjualan dari Shopee atau TikTok Shop untuk
          digabungkan
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Main Upload steps */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        {/* Step 1: Select File */}
        {uploadStep === "select" && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center transition ${dragActive ? "border-orange-500 bg-orange-50/20" : "border-border hover:border-slate-400"}`}
          >
            <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 text-slate-650 dark:text-slate-400 mb-4">
              <Upload className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">
              Pilih file spreadsheet penjualan
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Dukung format .csv atau .xlsx (Max 10MB)
            </p>

            <input
              type="file"
              id="file-upload"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById("file-upload").click()}
              className="bg-orange-600 hover:bg-orange-500 text-white"
            >
              Cari File
            </Button>
          </div>
        )}

        {/* Loading / Processing screen */}
        {uploadStep === "processing" && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <RefreshCw className="h-8 w-8 text-orange-500 animate-spin mb-4" />
            <h3 className="font-semibold text-base">
              Memproses Spreadsheet...
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Membaca data kolom dan melakukan validasi header.
            </p>
          </div>
        )}

        {/* Step 2: Mapping columns */}
        {uploadStep === "mapping" && analysis && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-orange-500" />{" "}
                  {file?.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Berhasil mendeteksi {analysis.headers.length} kolom data.
                  Silakan petakan kolom di bawah ini.
                </p>
              </div>

              {/* Store selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Store Tujuan:
                </span>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="rounded border border-border bg-background px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Pilih Store...</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.storeName} ({s.platform})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mapping Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase bg-slate-50 dark:bg-slate-800/40">
                    <th className="px-4 py-2">Kolom Sistem (Target)</th>
                    <th className="px-4 py-2">Kolom File Anda</th>
                    <th className="px-4 py-2">Preview Nilai (Baris 1)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {systemFields.map((field) => (
                    <tr key={field.key} className="hover:bg-slate-50/30">
                      <td className="px-4 py-3 font-medium">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-0.5">*</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={mapping[field.key] || ""}
                          onChange={(e) =>
                            handleMappingChange(field.key, e.target.value)
                          }
                          className="w-full max-w-xs rounded border border-border bg-background px-2 py-1 text-xs focus:border-orange-500 focus:outline-none"
                        >
                          <option value="">
                            -- Pilih Kolom Spreadsheet --
                          </option>
                          {analysis.headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {mapping[field.key]
                          ? String(analysis.sample[mapping[field.key]] || "N/A")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={handleReset}>
                Batal
              </Button>
              <Button
                onClick={handleStartImport}
                disabled={processMutation.isLoading}
                className="bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-2"
              >
                {processMutation.isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Mulai Import <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Result screen */}
        {uploadStep === "result" && importResult && (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center text-center py-6">
              {importResult.failedRows.length === 0 ? (
                <div className="rounded-full bg-green-50 dark:bg-green-950/20 p-4 text-green-500 mb-3">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
              ) : importResult.history.status === "PARTIAL" ? (
                <div className="rounded-full bg-orange-50 dark:bg-orange-950/20 p-4 text-orange-500 mb-3">
                  <AlertTriangle className="h-10 w-10" />
                </div>
              ) : (
                <div className="rounded-full bg-red-50 dark:bg-red-950/20 p-4 text-red-500 mb-3">
                  <XCircle className="h-10 w-10" />
                </div>
              )}
              <h3 className="text-xl font-bold">Import Data Selesai</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {importResult.message}
              </p>
            </div>

            {/* Failed rows panel */}
            {importResult.failedRows.length > 0 && (
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="font-semibold text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Detail Baris Gagal (
                  {importResult.failedRows.length})
                </h4>
                <div className="max-h-60 overflow-y-auto rounded-lg border border-border bg-slate-50 dark:bg-slate-900/60 p-3 font-mono text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="pb-1 text-center w-16">Baris Excel</th>
                        <th className="pb-1 w-32">Order ID</th>
                        <th className="pb-1 w-32">SKU</th>
                        <th className="pb-1">Deskripsi Kesalahan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {importResult.failedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-100/50 dark:hover:bg-slate-850"
                        >
                          <td className="py-1.5 text-center">{row.row}</td>
                          <td className="py-1.5">{row.orderNumber}</td>
                          <td className="py-1.5">{row.sku}</td>
                          <td className="py-1.5 text-red-500">{row.errors}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                onClick={handleReset}
                className="bg-orange-600 hover:bg-orange-500 text-white"
              >
                Upload File Lain
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Import History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-orange-500" /> Riwayat Import
          Terakhir
        </h3>

        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
          {isHistoryLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Memuat riwayat...
            </div>
          ) : history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-3">Waktu Upload</th>
                    <th className="px-6 py-3">Nama File</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Sukses</th>
                    <th className="px-6 py-3 text-right">Gagal</th>
                    <th className="px-6 py-3 text-right">Total Baris</th>
                    <th className="px-6 py-3">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((h) => {
                    const dateStr = new Date(h.timestamp).toLocaleString(
                      "id-ID",
                    );
                    const statusColor =
                      h.status === "SUCCESS"
                        ? "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50"
                        : h.status === "FAILED"
                          ? "text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
                          : "text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50";
                    return (
                      <tr key={h.id} className="hover:bg-slate-50/20">
                        <td className="px-6 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          {dateStr}
                        </td>
                        <td
                          className="px-6 py-3 font-medium max-w-[200px] truncate"
                          title={h.filename}
                        >
                          {h.filename}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
                          >
                            {h.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-medium text-green-600">
                          {h.totalRows - h.failedRows}
                        </td>
                        <td className="px-6 py-3 text-right font-medium text-red-500">
                          {h.failedRows}
                        </td>
                        <td className="px-6 py-3 text-right font-medium">
                          {h.totalRows}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-muted-foreground">
                          {h.uploadedBy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground italic">
              Belum ada riwayat import data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
