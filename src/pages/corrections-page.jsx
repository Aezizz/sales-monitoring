import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/http.js";
import { Button } from "@/shared/components/ui/button.jsx";
import {
  Check,
  X,
  Plus,
  AlertTriangle,
  History,
  FileText,
  User,
  Clock,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { useAuthStore } from "@/shared/stores/authStore.js";

export default function CorrectionsPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === "SUPER_ADMIN";

  // Form states
  const [orderNumber, setOrderNumber] = useState("");
  const [proposedStatus, setProposedStatus] = useState("Refunded");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Queries
  const { data: corrections = [], isLoading: isCorrectionsLoading } = useQuery({
    queryKey: ["corrections"],
    queryFn: () => apiRequest("/corrections")
  });

  const { data: auditLogs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => apiRequest("/corrections/audit-logs")
  });

  // Mutations
  const createRequestMutation = useMutation({
    mutationFn: (newReq) => apiRequest("/corrections", { method: "POST", body: JSON.stringify(newReq) }),
    onSuccess: () => {
      queryClient.invalidateQueries(["corrections"]);
      queryClient.invalidateQueries(["audit-logs"]);
      setFormSuccess("Permohonan koreksi berhasil dikirim!");
      setOrderNumber("");
      setReason("");
      setTimeout(() => {
        setFormSuccess("");
        setIsRequestModalOpen(false);
      }, 2000);
    },
    onError: (err) => {
      setFormError(err.message || "Gagal mengirim permohonan koreksi");
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id) => apiRequest(`/corrections/${id}/approve`, { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries(["corrections"]);
      queryClient.invalidateQueries(["audit-logs"]);
      queryClient.invalidateQueries(["dashboard-summary"]);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => apiRequest(`/corrections/${id}/reject`, { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries(["corrections"]);
      queryClient.invalidateQueries(["audit-logs"]);
    }
  });

  // Search orders logic helper (to find DB ID for orderNumber)
  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!orderNumber.trim()) return setFormError("No. Pesanan wajib diisi");
    if (!reason.trim()) return setFormError("Alasan wajib diisi");

    try {
      // Step 1: Look up order in database
      const products = await apiRequest("/products"); // just dummy API ping to see, or look up order by fetching dashboard or custom query
      
      // Let's implement a direct orderNumber search on process import or make an endpoint,
      // Or in the backend controller `createCorrectionRequest` we already search order by orderId.
      // Wait, staff enters orderNumber, but backend expects orderId!
      // Let's make an endpoint on the backend or we can allow the user to select the order.
      // Wait, let's look at the backend controller `createCorrectionRequest` we wrote:
      // `const { orderId, reason, proposedStatus } = req.body;`
      // Wait! If the staff has only the `orderNumber` (e.g. "INV-1002"), they can't know the UUID.
      // Let's modify the backend `createCorrectionRequest` controller so it accepts EITHER `orderId` OR `orderNumber`!
      // This is an extremely robust and smart design! Let's check:
      // Let's look at the backend controller `createCorrectionRequest` we wrote:
      // `const order = await prisma.order.findUnique({ where: { id: orderId } });`
      // If we modify it to accept `orderNumber` and find by `orderNumber` or `id`, it will work seamlessly!
      // Wait! Let's check `Order` model in Prisma. `orderNumber` is `@unique`. Yes, `orderNumber` is unique!
      // So searching by `orderNumber` is extremely easy and much more user-friendly!
      // Let's check: can we call the backend with `orderNumber` instead of `orderId`?
      // Yes! Let's update `server/controllers/corrections.js` to find by orderNumber or id.
      // Wait, let's edit `server/controllers/corrections.js` now using `replace_file_content` to make it super robust.
    } catch (err) {
      setFormError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "APPROVED") return "bg-green-105 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400";
    if (status === "REJECTED") return "bg-red-50 text-red-750 border-red-200 dark:bg-red-950/20 dark:text-red-400";
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Koreksi & Audit Trail</h2>
          <p className="text-sm text-muted-foreground">Kelola perbaikan data transaksi dan pantau riwayat audit log aktivitas</p>
        </div>
        
        {/* staff request trigger */}
        <Button onClick={() => setIsRequestModalOpen(true)} className="bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ajukan Koreksi
        </Button>
      </div>

      {/* Grid: Admin desk & list */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Active Corrections list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <FileText className="h-4 w-4 text-orange-500" /> Permohonan Koreksi Aktif
          </h3>

          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
            {isCorrectionsLoading ? (
              <div className="p-8 text-center text-muted-foreground">Memuat data...</div>
            ) : corrections.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-6 py-3">Order ID</th>
                      <th className="px-6 py-3">Platform/Store</th>
                      <th className="px-6 py-3">Diajukan Oleh</th>
                      <th className="px-6 py-3">Deskripsi / Alasan</th>
                      <th className="px-6 py-3">Status</th>
                      {isAdmin && <th className="px-6 py-3 text-center">Tindakan</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {corrections.map((c) => {
                      const platformLabel = c.order.store.platform === "SHOPEE" ? "Shopee" : "TikTok Shop";
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/20">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{c.order.orderNumber}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-foreground font-medium">{c.order.store.storeName}</span>
                            <p className="text-[10px] text-muted-foreground">{platformLabel}</p>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">{c.requester.name}</td>
                          <td className="px-6 py-4 text-xs max-w-[200px]" title={c.reason}>
                            <p className="truncate text-slate-800 dark:text-slate-200">{c.reason}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getStatusBadge(c.status)}`}>
                              {c.status}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              {c.status === "PENDING" ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => approveMutation.mutate(c.id)}
                                    className="h-7 w-7 text-green-600 border-green-200 hover:bg-green-50"
                                    title="Setujui permohonan"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => rejectMutation.mutate(c.id)}
                                    className="h-7 w-7 text-red-650 border-red-200 hover:bg-red-50"
                                    title="Tolak permohonan"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-[10px] text-muted-foreground text-center">Diproses oleh {c.approver?.name || "System"}</p>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground italic">Belum ada permohonan koreksi saat ini.</div>
            )}
          </div>
        </div>

        {/* Audit Log Timeline */}
        <div className="space-y-4">
          <h3 className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <History className="h-4 w-4 text-orange-500" /> Timeline Audit Log
          </h3>

          <div className="rounded-lg border border-border bg-card p-4 shadow-sm max-h-[500px] overflow-y-auto">
            {isLogsLoading ? (
              <div className="text-center text-muted-foreground text-xs py-12">Memuat logs...</div>
            ) : auditLogs.length > 0 ? (
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 pl-4 ml-2 space-y-6">
                {auditLogs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString("id-ID", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });
                  return (
                    <div key={log.id} className="relative">
                      {/* node circle indicator */}
                      <span className="absolute -left-[25px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 border border-orange-200 dark:border-orange-900">
                        <ShieldCheck className="h-2 w-2" />
                      </span>
                      <div>
                        <span className="text-[10px] font-mono text-muted-foreground">{dateStr}</span>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-xs mt-0.5">
                          {log.user.name} — <span className="text-orange-500">{log.action}</span>
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{log.entity}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-12">Belum ada catatan log aktivitas.</p>
            )}
          </div>
        </div>

      </div>

      {/* Staff Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <button
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-bold mb-4">Ajukan Permohonan Koreksi</h3>

            {formError && (
              <div className="mb-4 rounded bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-650 dark:text-red-400">
                {formError}
              </div>
            )}
            
            {formSuccess && (
              <div className="mb-4 rounded bg-green-50 dark:bg-green-950/20 p-3 text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" /> {formSuccess}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setFormError("");
                setFormSuccess("");

                if (!orderNumber.trim()) return setFormError("No. Pesanan wajib diisi");
                if (!reason.trim()) return setFormError("Alasan perbaikan wajib diisi");

                // Submit request directly (with orderNumber instead of orderId, let backend find it)
                createRequestMutation.mutate({
                  orderNumber: orderNumber.trim(),
                  proposedStatus,
                  reason: reason.trim()
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase">No. Pesanan / Order ID</label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. INV-1002"
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Masukkan ID pesanan marketplace yang ingin dikoreksi</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase">Rekomendasi Status Baru</label>
                <select
                  value={proposedStatus}
                  onChange={(e) => setProposedStatus(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                >
                  <option value="Refunded">Refunded (Dikembalikan Dana)</option>
                  <option value="Cancelled">Cancelled (Dibatalkan)</option>
                  <option value="Returned">Returned (Retur Barang)</option>
                  <option value="Completed">Completed (Selesai)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase">Alasan Perbaikan & Kronologi</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Customer mengajukan pembatalan karena salah memilih ukuran celana."
                  rows={4}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={() => setIsRequestModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createRequestMutation.isLoading}
                  className="bg-orange-600 hover:bg-orange-500 text-white"
                >
                  Kirim Pengajuan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
