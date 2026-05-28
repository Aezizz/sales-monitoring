import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/http.js";
import { DataTable } from "@/shared/components/data-table.jsx";
import { Button } from "@/shared/components/ui/button.jsx";
import { Plus, Edit2, Trash2, X, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/shared/stores/authStore.js";

export default function StoresPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isWritable = user?.role === "SUPER_ADMIN" || user?.role === "STAFF";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  
  // Form States
  const [platform, setPlatform] = useState("SHOPEE");
  const [storeName, setStoreName] = useState("");
  const [formError, setFormError] = useState("");

  // Queries
  const { data: stores = [], isLoading, isError } = useQuery({
    queryKey: ["stores"],
    queryFn: () => apiRequest("/stores")
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newStore) => apiRequest("/stores", { method: "POST", body: JSON.stringify(newStore) }),
    onSuccess: () => {
      queryClient.invalidateQueries(["stores"]);
      closeModal();
    },
    onError: (err) => setFormError(err.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedStore }) =>
      apiRequest(`/stores/${id}`, { method: "PUT", body: JSON.stringify(updatedStore) }),
    onSuccess: () => {
      queryClient.invalidateQueries(["stores"]);
      closeModal();
    },
    onError: (err) => setFormError(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiRequest(`/stores/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries(["stores"]);
    }
  });

  const openCreateModal = () => {
    setEditingStore(null);
    setPlatform("SHOPEE");
    setStoreName("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (store) => {
    setEditingStore(store);
    setPlatform(store.platform);
    setStoreName(store.storeName);
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStore(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setFormError("");

    if (!storeName.trim()) return setFormError("Store name is required");

    const payload = {
      platform,
      storeName: storeName.trim()
    };

    if (editingStore) {
      updateMutation.mutate({ id: editingStore.id, updatedStore: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this store integration? Orders associated with this store might lose references.")) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    {
      key: "platform",
      label: "Platform Marketplace",
      render: (row) => {
        const logoColor = row.platform === "SHOPEE" 
          ? "bg-orange-100 text-orange-650 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900/50" 
          : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700";
        const label = row.platform === "SHOPEE" ? "Shopee" : "TikTok Shop";
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${logoColor}`}>
            {label}
          </span>
        );
      }
    },
    { key: "storeName", label: "Store Connection Name" },
    {
      key: "createdAt",
      label: "Date Added",
      render: (row) => new Date(row.createdAt).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditModal(row)}
            title="Edit store"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          {isWritable && (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-650"
              onClick={() => handleDelete(row.id)}
              title="Delete store connection"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-[300px] w-full bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
        <h3 className="text-lg font-bold">Failed to load store configurations</h3>
        <p className="text-sm text-muted-foreground mt-1">Please ensure the backend API server is reachable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Master Stores</h2>
          <p className="text-sm text-muted-foreground">Manage channels and storefront identities for platform mapping</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={stores}
        searchKey="storeName"
        searchPlaceholder="Search store by name..."
        actions={
          isWritable ? (
            <Button onClick={openCreateModal} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white">
              <Plus className="h-4 w-4" />
              Connect Store
            </Button>
          ) : null
        }
      />

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold mb-4">
              {editingStore ? "Edit Store Connection" : "Connect New Marketplace Store"}
            </h3>

            {formError && (
              <div className="mb-4 rounded bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-600 dark:text-red-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase">Marketplace Platform</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlatform("SHOPEE")}
                    className={`rounded-lg border p-3 text-center text-sm font-semibold transition ${platform === "SHOPEE" ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400" : "border-border hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                  >
                    Shopee
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatform("TIKTOK")}
                    className={`rounded-lg border p-3 text-center text-sm font-semibold transition ${platform === "TIKTOK" ? "border-slate-800 bg-slate-100 dark:border-slate-650 dark:bg-slate-800 dark:text-white" : "border-border hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                  >
                    TikTok Shop
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase">Store Connection Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g., Insight Official Store Shopee"
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="bg-orange-600 hover:bg-orange-500 text-white"
                >
                  Save Connection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
