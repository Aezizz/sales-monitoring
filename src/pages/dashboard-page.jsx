import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/http.js";
import { Button } from "@/shared/components/ui/button.jsx";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell
} from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  DollarSign,
  Percent,
  RefreshCw,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown
} from "lucide-react";

export default function DashboardPage() {
  const [storeId, setStoreId] = useState("");
  const [platform, setPlatform] = useState("");
  const [dateRange, setDateRange] = useState("30"); // 7, 30, 90 days

  // Get date range filters
  const getFilters = () => {
    if (dateRange === "all") {
      return { startDate: "", endDate: "" };
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - Number(dateRange));
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0]
    };
  };

  const { startDate, endDate } = getFilters();

  // Queries (with 30 seconds polling interval)
  const queryParams = `?startDate=${startDate}&endDate=${endDate}${storeId ? `&storeId=${storeId}` : ""}${platform ? `&platform=${platform}` : ""}`;

  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ["dashboard-summary", startDate, endDate, storeId, platform],
    queryFn: () => apiRequest(`/dashboard/summary${queryParams}`),
    refetchInterval: 30000 // 30s polling
  });

  const { data: trends = [], isLoading: isTrendsLoading } = useQuery({
    queryKey: ["dashboard-trends", startDate, endDate, storeId, platform],
    queryFn: () => apiRequest(`/dashboard/trends${queryParams}&viewMode=daily`),
    refetchInterval: 30000
  });

  const { data: topProducts = [], isLoading: isTopProdLoading } = useQuery({
    queryKey: ["dashboard-top-products", startDate, endDate, storeId, platform],
    queryFn: () => apiRequest(`/dashboard/top-products${queryParams}`),
    refetchInterval: 30000
  });

  const { data: platformComparison = [] } = useQuery({
    queryKey: ["dashboard-platform", startDate, endDate],
    queryFn: () => apiRequest(`/dashboard/platform-comparison?startDate=${startDate}&endDate=${endDate}`),
    refetchInterval: 30000
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: () => apiRequest("/stores")
  });

  const handleRefreshAll = () => {
    refetchSummary();
  };

  const kpis = summary?.kpis || {
    gmv: 0,
    totalOrders: 0,
    itemsSold: 0,
    refundAmount: 0,
    conversionRate: 0,
    aov: 0
  };

  const recentActivities = summary?.recentActivities || [];

  const platformColors = {
    "Shopee": "#FF7A00", // Shopee orange
    "TikTok Shop": "#0F172A" // Dark slate
  };

  const isAllLoading = isSummaryLoading || isTrendsLoading || isTopProdLoading;

  if (isAllLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">Monitor performa penjualan, promo, dan gmv marketplace Anda</p>
        </div>
        
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Platform filter */}
          <select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value);
              setStoreId(""); // reset store
            }}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs focus:border-orange-500 focus:outline-none"
          >
            <option value="">Semua Platform</option>
            <option value="SHOPEE">Shopee</option>
            <option value="TIKTOK">TikTok Shop</option>
          </select>

          {/* Store filter */}
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs focus:border-orange-500 focus:outline-none"
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

          {/* Time range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs focus:border-orange-500 focus:outline-none"
          >
            <option value="7">7 Hari Terakhir</option>
            <option value="30">30 Hari Terakhir</option>
            <option value="90">90 Hari Terakhir</option>
            <option value="all">Semua Waktu</option>
          </select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefreshAll}
            className="h-8 w-8"
            title="Refresh Manual"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* GMV Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 h-24 w-24 bg-orange-500/5 rounded-full -mr-8 -mt-8" />
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
            <span>Gross Merchandise Value</span>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            Rp {kpis.gmv.toLocaleString("id-ID")}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <TrendingUp className="h-3 w-3" />
            <span>+12.4% vs bln lalu</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
            <span>Total Orders</span>
            <ShoppingBag className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {kpis.totalOrders.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <TrendingUp className="h-3 w-3" />
            <span>+8.2% vs bln lalu</span>
          </div>
        </div>

        {/* Items Sold */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
            <span>Items Sold</span>
            <Package className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {kpis.itemsSold.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <TrendingUp className="h-3 w-3" />
            <span>+9.5% vs bln lalu</span>
          </div>
        </div>

        {/* Refund Amount */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
            <span>Refund Amount</span>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            Rp {kpis.refundAmount.toLocaleString("id-ID")}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
            <TrendingDown className="h-3 w-3" />
            <span>-2.1% perbaikan</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
            <span>Marketplace Conversion</span>
            <Percent className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {kpis.conversionRate}%
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <span>Avg platform benchmark: 2.8%</span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
            <span>Average Order Value</span>
            <Layers className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            Rp {Math.round(kpis.aov).toLocaleString("id-ID")}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
            <span>Keranjang belanja meningkat</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Tren Penjualan Harian</h3>
              <p className="text-xs text-muted-foreground">Volume GMV penjualan sepanjang periode waktu terpilih</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FF7A00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `Rp ${v >= 1000000 ? `${v / 1000000}M` : `${v / 1000}k`}`}
                  />
                  <Tooltip
                    formatter={(v) => [`Rp ${Number(v).toLocaleString("id-ID")}`, "GMV"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#FF7A00" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
                Belum ada transaksi di periode ini.
              </div>
            )}
          </div>
        </div>

        {/* Platform Comparison */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Perbandingan Platform</h3>
            <p className="text-xs text-muted-foreground">Pembagian kontribusi omzet Shopee vs TikTok Shop</p>
          </div>
          <div className="h-72 w-full flex flex-col justify-center">
            {platformComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={platformComparison}>
                  <XAxis dataKey="platform" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickFormatter={(v) => `Rp ${v / 1000000}jt`} tickLine={false} />
                  <Tooltip formatter={(v) => `Rp ${Number(v).toLocaleString("id-ID")}`} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={45}>
                    {platformComparison.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={platformColors[entry.platform] || "#E5E7EB"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
                Data tidak tersedia.
              </div>
            )}
            {/* Legend label */}
            <div className="flex items-center justify-center gap-6 text-xs mt-2 border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#FF7A00]" />
                <span>Shopee</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#0F172A] dark:bg-slate-400" />
                <span>TikTok Shop</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Bottom: Top products & recent activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Products */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Produk Terlaris</h3>
              <p className="text-xs text-muted-foreground font-medium">Berdasarkan total revenue pesanan terimport</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                  <th className="py-2">Nama Produk</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2 text-right">Unit Terjual</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-slate-700 dark:text-slate-300">
                {topProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/20">
                    <td className="py-2.5 font-semibold text-slate-950 dark:text-white max-w-[200px] truncate" title={p.name}>{p.name}</td>
                    <td className="py-2.5">{p.sku}</td>
                    <td className="py-2.5 text-right font-medium">{p.unitsSold} pcs</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900 dark:text-white">Rp {p.revenue.toLocaleString("id-ID")}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center italic text-muted-foreground">Belum ada data produk terjual.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities Console */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Aktivitas Audit Log</h3>
          <div className="flex-1 space-y-4">
            {recentActivities.map((act) => {
              const time = new Date(act.createdAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit"
              });
              return (
                <div key={act.id} className="flex gap-3 text-xs align-start">
                  <div className="h-6 w-6 rounded-full bg-slate-105 dark:bg-slate-800 flex items-center justify-center shrink-0 border">
                    <TrendingUp className="h-3 w-3 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {act.user} — <span className="text-muted-foreground">{act.type}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{act.entity}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">{time}</span>
                </div>
              );
            })}
            {recentActivities.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-12">Belum ada catatan aktivitas audit.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
