import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/http.js";
import { DataTable } from "@/shared/components/data-table.jsx";
import { Button } from "@/shared/components/ui/button.jsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  Plus,
  Trash2,
  X,
  TrendingUp,
  DollarSign,
  Briefcase,
  Percent,
  AlertTriangle
} from "lucide-react";
import { useAuthStore } from "@/shared/stores/authStore.js";

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isWritable = user?.role === "SUPER_ADMIN" || user?.role === "STAFF";

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("SHOPEE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [formError, setFormError] = useState("");

  // Queries
  const { data: analytics, isLoading, isError } = useQuery({
    queryKey: ["promotions-analytics"],
    queryFn: () => apiRequest("/promotions/analytics")
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newPromo) => apiRequest("/promotions", { method: "POST", body: JSON.stringify(newPromo) }),
    onSuccess: () => {
      queryClient.invalidateQueries(["promotions-analytics"]);
      closeModal();
    },
    onError: (err) => setFormError(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiRequest(`/promotions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries(["promotions-analytics"]);
    }
  });

  const openCreateModal = () => {
    setName("");
    setPlatform("SHOPEE");
    setStartDate("");
    setEndDate("");
    setBudget(0);
    setRevenue(0);
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) return setFormError("Nama promo wajib diisi");
    if (!startDate) return setFormError("Tanggal mulai wajib diisi");
    if (!endDate) return setFormError("Tanggal berakhir wajib diisi");
    if (budget < 0) return setFormError("Budget tidak boleh bernilai negatif");
    if (revenue < 0) return setFormError("Revenue tidak boleh bernilai negatif");

    createMutation.mutate({
      name: name.trim(),
      platform,
      startDate,
      endDate,
      budget: Number(budget),
      revenue: Number(revenue)
    });
  };

  const handleDelete = (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus data promo ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const summary = analytics?.summary || { totalBudget: 0, totalRevenue: 0, roi: 0, campaignsCount: 0 };
  const chartData = analytics?.campaignsDetail || [];

  const columns = [
    { key: "name", label: "Nama Campaign / Promo" },
    {
      key: "platform",
      label: "Platform",
      render: (row) => (row.platform === "SHOPEE" ? "Shopee" : "TikTok Shop")
    },
    {
      key: "startDate",
      label: "Mulai",
      render: (row) => new Date(row.startDate).toLocaleDateString("id-ID")
    },
    {
      key: "endDate",
      label: "Berakhir",
      render: (row) => new Date(row.endDate).toLocaleDateString("id-ID")
    },
    {
      key: "budget",
      label: "Biaya (Budget)",
      render: (row) => `Rp ${row.budget.toLocaleString("id-ID")}`
    },
    {
      key: "revenue",
      label: "Omzet (Revenue)",
      render: (row) => `Rp ${row.revenue.toLocaleString("id-ID")}`
    },
    {
      key: "roi",
      label: "ROI Factor",
      render: (row) => {
        const color = row.roi >= 3
          ? "text-green-600 dark:text-green-400 font-semibold"
          : row.roi >= 1.2
            ? "text-orange-650"
            : "text-red-500 font-semibold";
        return <span className={color}>{row.roi}x</span>;
      }
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        isWritable && (
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-650"
            onClick={() => handleDelete(row.id)}
            title="Hapus data promo"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-40 w-full bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
        <h3 className="text-lg font-bold">Gagal memuat analitik promo</h3>
        <p className="text-sm text-muted-foreground mt-1">Harap periksa koneksi internet Anda atau server API.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analitik Promosi & Ads</h2>
          <p className="text-sm text-muted-foreground">Analisis efisiensi biaya iklan, budget, ROI, dan profitabilitas campaign</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
            <span>Total Budget Iklan</span>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            Rp {summary.totalBudget.toLocaleString("id-ID")}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
            <span>Omzet Tergenerate</span>
            <Briefcase className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            Rp {summary.totalRevenue.toLocaleString("id-ID")}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
            <span>Rata-Rata ROI</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {summary.roi}x
          </div>
          <div className="mt-1 text-[10px] text-green-600">ROI target &gt; 2.5x</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
            <span>Jumlah Campaign</span>
            <Percent className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {summary.campaignsCount} Iklan
          </div>
        </div>
      </div>

      {/* Chart comparing Budget and Revenue */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Biaya Iklan (Budget) vs Omzet (Revenue) per Campaign</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickFormatter={(v) => `Rp ${v / 1000}k`} tickLine={false} />
                <Tooltip formatter={(v) => `Rp ${Number(v).toLocaleString("id-ID")}`} />
                <Legend />
                <Bar dataKey="budget" name="Budget (Biaya)" fill="#FF9F43" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name="Revenue (Hasil)" fill="#FF7A00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Promotions Table */}
      <DataTable
        columns={columns}
        data={chartData}
        searchKey="name"
        searchPlaceholder="Cari berdasarkan nama campaign..."
        actions={
          isWritable ? (
            <Button onClick={openCreateModal} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white">
              <Plus className="h-4 w-4" />
              Tambah Record Promo
            </Button>
          ) : null
        }
      />

      {/* Create Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-bold mb-4">Input Data Campaign Iklan</h3>

            {formError && (
              <div className="mb-4 rounded bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-650 dark:text-red-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase">Nama Campaign / Promo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramadhan Mega Sale 5.5"
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                >
                  <option value="SHOPEE">Shopee Ads</option>
                  <option value="TIKTOK">TikTok Shop ShopAds</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">Budget Terpakai (Cost)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    placeholder="1500000"
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">Omzet Tergenerate (Revenue)</label>
                  <input
                    type="number"
                    value={revenue}
                    onChange={(e) => setRevenue(Number(e.target.value))}
                    placeholder="5000000"
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="bg-orange-600 hover:bg-orange-500 text-white"
                >
                  Simpan Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
