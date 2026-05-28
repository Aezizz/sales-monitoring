import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/http.js";
import { Button } from "@/shared/components/ui/button.jsx";
import {
  Search,
  Database,
  Edit2,
  Trash2,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  X,
} from "lucide-react";

export default function DataManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({ quantity: 1, totalAmount: 0, status: "Completed" });

  const { data, isLoading } = useQuery({
    queryKey: ["orders", search, page, limit],
    queryFn: () => apiRequest(`/orders?search=${search}&page=${page}&limit=${limit}`),
    keepPreviousData: true,
  });

  const updateMutation = useMutation({
    mutationFn: (payload) =>
      apiRequest(`/orders/${payload.id}`, {
        method: "PUT",
        body: JSON.stringify(payload.data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["orders"]);
      setIsEditModalOpen(false);
      setSelectedOrder(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      apiRequest(`/orders/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["orders"]);
      setIsDeleteModalOpen(false);
      setSelectedOrder(null);
    },
  });

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setEditForm({
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      status: order.status,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (order) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedOrder) return;
    updateMutation.mutate({
      id: selectedOrder.id,
      data: editForm,
    });
  };

  const handleDelete = () => {
    if (!selectedOrder) return;
    deleteMutation.mutate(selectedOrder.id);
  };

  const exportRowToCSV = (order) => {
    const headers = ["Order ID", "Store", "Product", "SKU", "Quantity", "Total Amount", "Status", "Order Date"];
    const row = [
      order.orderNumber,
      order.store.storeName,
      order.product.name,
      order.product.sku,
      order.quantity,
      order.totalAmount,
      order.status,
      new Date(order.orderDate).toISOString(),
    ];

    const csvContent = [headers.join(","), row.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Export_${order.orderNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="h-6 w-6 text-orange-500" /> Data Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Kelola seluruh data transaksi (khusus Super Admin)
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari Order ID..."
            value={search}
            onChange={handleSearch}
            className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:border-orange-500 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4">Toko</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-orange-500" />
                    Memuat data...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground italic">
                    Data tidak ditemukan.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{order.product?.name}</div>
                      <div className="text-xs text-muted-foreground">{order.product?.sku}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.store?.storeName}</div>
                      <div className="text-xs text-muted-foreground">{order.store?.platform}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(order.orderDate).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 font-medium">{order.quantity}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      Rp {order.totalAmount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 text-xs font-medium bg-slate-50 dark:bg-slate-800">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          onClick={() => openEditModal(order)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          onClick={() => exportRowToCSV(order)}
                          title="Export CSV"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => openDeleteModal(order)}
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Edit Data Order</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">Order ID</label>
                <div className="font-medium">{selectedOrder?.orderNumber}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded bg-background focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">Total Amount (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.totalAmount}
                    onChange={(e) => setEditForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded bg-background focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">Status</label>
                <input
                  type="text"
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded bg-background focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isLoading} className="bg-orange-600 hover:bg-orange-500 text-white">
                {updateMutation.isLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-sm rounded-xl shadow-xl overflow-hidden p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Hapus Data Order?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Data <b>{selectedOrder?.orderNumber}</b> akan dihapus secara permanen. Aksi ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Batal</Button>
              <Button onClick={handleDelete} disabled={deleteMutation.isLoading} className="bg-red-600 hover:bg-red-500 text-white">
                {deleteMutation.isLoading ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
