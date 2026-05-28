import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/http.js";
import { Button } from "@/shared/components/ui/button.jsx";
import {
  Download,
  Mail,
  Calendar,
  Layers,
  CheckCircle,
  AlertTriangle,
  FileText,
  FileSpreadsheet
} from "lucide-react";

export default function ExportPage() {
  const [platform, setPlatform] = useState("");
  const [storeId, setStoreId] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Scheduled reports form states
  const [schedEmail, setSchedEmail] = useState("");
  const [schedFreq, setSchedFreq] = useState("weekly");
  const [schedStoreId, setSchedStoreId] = useState("");
  const [schedPlatform, setSchedPlatform] = useState("");
  const [schedSuccess, setSchedSuccess] = useState("");
  const [schedError, setSchedError] = useState("");

  // Queries
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: () => apiRequest("/stores")
  });

  // Helper for triggers
  const handleDownload = async (format) => {
    try {
      const payload = {
        startDate,
        endDate,
        storeId: storeId || undefined,
        platform: platform || undefined
      };

      const responseBlob = await apiRequest(`/export/${format}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      // Download file in browser
      const url = window.URL.createObjectURL(responseBlob);
      const link = document.createElement("a");
      link.href = url;
      
      const fileExtensions = { csv: "csv", xlsx: "xlsx", pdf: "pdf" };
      link.setAttribute("download", `sales_report_${startDate}_to_${endDate}.${fileExtensions[format]}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert(`Gagal mengekspor laporan: ${err.message}`);
    }
  };

  // Schedule mutation
  const scheduleMutation = useMutation({
    mutationFn: (payload) => apiRequest("/export/schedule", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: (data) => {
      setSchedSuccess(`Laporan otomatis berhasil dijadwalkan! Dikirim ke: ${data.recipient}`);
      setSchedEmail("");
      setTimeout(() => setSchedSuccess(""), 4000);
    },
    onError: (err) => {
      setSchedError(err.message || "Gagal menjadwalkan laporan otomatis");
      setTimeout(() => setSchedError(""), 4000);
    }
  });

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    setSchedSuccess("");
    setSchedError("");

    if (!schedEmail.trim()) {
      setSchedError("Email penerima wajib diisi");
      return;
    }

    scheduleMutation.mutate({
      frequency: schedFreq,
      email: schedEmail.trim(),
      storeId: schedStoreId || undefined,
      platform: schedPlatform || undefined
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ekspor & Penjadwalan Laporan</h2>
        <p className="text-sm text-muted-foreground">Unduh laporan dalam format Excel/PDF atau atur pengiriman berkala via email</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        
        {/* On Demand Export */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="h-5 w-5 text-orange-500" /> Ekspor Manual (On-Demand)
          </h3>
          <p className="text-xs text-muted-foreground">
            Filter transaksi berdasarkan store, platform, dan tanggal kemudian unduh file laporan instan.
          </p>

          <div className="space-y-3 pt-2">
            {/* Platform & Store Select */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => {
                    setPlatform(e.target.value);
                    setStoreId("");
                  }}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-xs focus:outline-none"
                >
                  <option value="">Semua Platform</option>
                  <option value="SHOPEE">Shopee</option>
                  <option value="TIKTOK">TikTok Shop</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase">Store Channel</label>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-xs focus:outline-none"
                >
                  <option value="">Semua Store</option>
                  {stores
                    .filter((s) => !platform || s.platform === platform)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.storeName}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Date filter */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-1 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase">Tanggal Akhir</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-1 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Button
                onClick={() => handleDownload("xlsx")}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white flex items-center justify-center gap-2 h-10 text-xs font-semibold"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-500" /> Ekspor ke Excel (.xlsx)
              </Button>
              
              <Button
                onClick={() => handleDownload("pdf")}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white flex items-center justify-center gap-2 h-10 text-xs font-semibold"
              >
                <FileText className="h-4 w-4 text-red-500" /> Ekspor ke Ringkasan PDF (.pdf)
              </Button>
              
              <Button
                onClick={() => handleDownload("csv")}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 h-10 text-xs"
              >
                Unduh Data CSV (.csv)
              </Button>
            </div>
          </div>
        </div>

        {/* Scheduled reporting */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-500" /> Email Laporan Berkala (Scheduled)
          </h3>
          <p className="text-xs text-muted-foreground">
            Sistem akan secara otomatis mengirimkan rangkuman Excel penjualan berdasarkan jadwal yang dipilih ke alamat email terdaftar.
          </p>

          {schedError && (
            <div className="rounded bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-650 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> {schedError}
            </div>
          )}

          {schedSuccess && (
            <div className="rounded bg-green-50 dark:bg-green-950/20 p-3 text-xs text-green-650 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" /> {schedSuccess}
            </div>
          )}

          <form onSubmit={handleScheduleSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase">Email Penerima Laporan</label>
              <input
                type="email"
                value={schedEmail}
                onChange={(e) => setSchedEmail(e.target.value)}
                placeholder="owner@insight-commerce.com"
                className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase">Frekuensi Pengiriman</label>
                <select
                  value={schedFreq}
                  onChange={(e) => setSchedFreq(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-xs focus:outline-none"
                >
                  <option value="daily">Setiap Hari (08:00 WIB)</option>
                  <option value="weekly">Setiap Senin (08:00 WIB)</option>
                  <option value="monthly">Setiap Tanggal 1 (08:00 WIB)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase">Sumber Data Store</label>
                <select
                  value={schedStoreId}
                  onChange={(e) => setSchedStoreId(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-xs focus:outline-none"
                >
                  <option value="">Semua Store Channel</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.storeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={scheduleMutation.isLoading}
                className="w-full bg-orange-650 hover:bg-orange-600 text-white flex items-center justify-center gap-2 h-10 text-xs font-semibold"
              >
                Aktifkan Laporan Otomatis
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
