import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/http.js";
import { DataTable } from "@/shared/components/data-table.jsx";
import { Button } from "@/shared/components/ui/button.jsx";
import { Plus, Edit2, Trash2, X, PlusCircle, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/shared/stores/authStore.js";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isWritable = user?.role === "SUPER_ADMIN" || user?.role === "STAFF";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form States
  const [sku, setSku] = useState("");
  const [parentSku, setParentSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [costPrice, setCostPrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [variants, setVariants] = useState([]); // Array of { variantName, stock }
  const [newVarName, setNewVarName] = useState("");
  const [newVarStock, setNewVarStock] = useState(0);
  const [formError, setFormError] = useState("");

  // Queries
  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiRequest("/products")
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newProd) => apiRequest("/products", { method: "POST", body: JSON.stringify(newProd) }),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      closeModal();
    },
    onError: (err) => setFormError(err.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedProd }) =>
      apiRequest(`/products/${id}`, { method: "PUT", body: JSON.stringify(updatedProd) }),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      closeModal();
    },
    onError: (err) => setFormError(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiRequest(`/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
    }
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setSku("");
    setParentSku("");
    setName("");
    setCategory("General");
    setCostPrice(0);
    setSellPrice(0);
    setVariants([]);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setSku(product.sku);
    setParentSku(product.parentSku || "");
    setName(product.name);
    setCategory(product.category || "General");
    setCostPrice(product.costPrice);
    setSellPrice(product.sellPrice);
    setVariants(product.variants ? product.variants.map(v => ({ variantName: v.variantName, stock: v.stock })) : []);
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleAddVariant = () => {
    if (!newVarName.trim()) return;
    setVariants([...variants, { variantName: newVarName.trim(), stock: Number(newVarStock) }]);
    setNewVarName("");
    setNewVarStock(0);
  };

  const handleRemoveVariant = (idx) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setFormError("");

    if (!sku.trim()) return setFormError("SKU is required");
    if (!name.trim()) return setFormError("Name is required");
    if (costPrice < 0) return setFormError("Cost Price cannot be negative");
    if (sellPrice < 0) return setFormError("Selling Price cannot be negative");

    const payload = {
      sku: sku.trim(),
      parentSku: parentSku.trim() || null,
      name: name.trim(),
      category: category.trim(),
      costPrice: Number(costPrice),
      sellPrice: Number(sellPrice),
      variants
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, updatedProd: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this product? All variants will be deleted too.")) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    {
      key: "sku",
      label: "SKU / Parent SKU",
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{row.sku}</span>
          {row.parentSku && (
            <p className="text-[10px] text-muted-foreground">Parent: {row.parentSku}</p>
          )}
        </div>
      )
    },
    { key: "name", label: "Product Name" },
    { key: "category", label: "Category" },
    {
      key: "costPrice",
      label: "Cost Price (HPP)",
      render: (row) => `Rp ${Number(row.costPrice).toLocaleString("id-ID")}`
    },
    {
      key: "sellPrice",
      label: "Selling Price",
      render: (row) => `Rp ${Number(row.sellPrice).toLocaleString("id-ID")}`
    },
    {
      key: "marginPercent",
      label: "Margin %",
      render: (row) => {
        const color = row.marginPercent > 30 
          ? "text-green-600 dark:text-green-400 font-semibold" 
          : row.marginPercent > 10 
            ? "text-orange-600 dark:text-orange-400" 
            : "text-red-600 dark:text-red-400 font-semibold";
        return <span className={color}>{row.marginPercent}%</span>;
      }
    },
    {
      key: "stock",
      label: "Total Stock",
      render: (row) => {
        const total = row.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
        return (
          <div>
            <span className="font-medium">{total} units</span>
            <p className="text-[10px] text-muted-foreground">{row.variants?.length ?? 0} variants</p>
          </div>
        );
      }
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
            title="Edit product"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          {isWritable && (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-600"
              onClick={() => handleDelete(row.id)}
              title="Delete product"
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
        <div className="h-[400px] w-full bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
        <h3 className="text-lg font-bold">Failed to load products</h3>
        <p className="text-sm text-muted-foreground mt-1">Please check your database connectivity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Master Products</h2>
          <p className="text-sm text-muted-foreground">Manage products SKUs, pricing margins, and variant stock</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        searchKey="name"
        searchPlaceholder="Search product by name..."
        actions={
          isWritable ? (
            <Button onClick={openCreateModal} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          ) : null
        }
      />

      {/* Slide-over or Modal Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold mb-4">
              {editingProduct ? `Edit Product: ${editingProduct.name}` : "Create New Product"}
            </h3>

            {formError && (
              <div className="mb-4 rounded bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-600 dark:text-red-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">SKU Code (Must be unique)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="PROD-TSHIRT-001"
                    disabled={!!editingProduct}
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">Parent SKU (Optional)</label>
                  <input
                    type="text"
                    value={parentSku}
                    onChange={(e) => setParentSku(e.target.value)}
                    placeholder="PROD-TSHIRT"
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Premium Unisex Cotton T-Shirt"
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Apparel"
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">Cost Price (HPP)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    placeholder="45000"
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">Selling Price</label>
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    placeholder="99000"
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">Manage Variants</h4>
                
                {/* Variant list */}
                <div className="space-y-2 mb-3">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded text-xs">
                      <div>
                        <span className="font-semibold text-foreground">{v.variantName}</span>
                        <span className="ml-2 text-muted-foreground">(Stock: {v.stock} pcs)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="text-red-500 hover:text-red-600 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {variants.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No variants added yet. Adding variants helps monitor stock.</p>
                  )}
                </div>

                {/* Variant input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    placeholder="Size M / Blue"
                    className="flex-1 rounded border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none"
                  />
                  <input
                    type="number"
                    value={newVarStock}
                    onChange={(e) => setNewVarStock(Number(e.target.value))}
                    placeholder="100"
                    className="w-24 rounded border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddVariant}
                    className="text-xs h-8 flex items-center gap-1"
                  >
                    <PlusCircle className="h-3 w-3" /> Add
                  </Button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="bg-orange-600 hover:bg-orange-500 text-white"
                >
                  Save Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
