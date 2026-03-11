import { useState, useEffect, useMemo } from "react";
import { formatNumber, getCurrencySymbol } from "@/lib/currency";
import { useToast } from "@/components/ui/ToastProvider";
import {
    ApiProduct, ApiCategory, ApiSupplier, ApiProductBatch, ApiStockAdjustment, ApiInventoryLedger,
    productApi, categoryApi, supplierApi, adjustmentApi, ledgerApi
} from "@/lib/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    PackageSearch, Layers, Users, History, ArrowRightLeft,
    Plus, Edit, Trash2, Search, Filter, Package, Power,
    ArrowUpRight, ArrowDownRight
} from "lucide-react";

import { ProductForm } from "@/components/ProductForm";
import { CategoryForm } from "@/components/inventory/CategoryForm";
import { SupplierForm } from "@/components/inventory/SupplierForm";
import { BatchForm } from "@/components/inventory/BatchForm";
import { StockAdjustmentForm } from "@/components/inventory/StockAdjustmentForm";
import { LedgerTable } from "@/components/inventory/LedgerTable";

type TabType = "products" | "batches" | "categories" | "suppliers" | "adjustments" | "ledger";

export default function InventoryPage() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<TabType>("products");
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Data states
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
    const [batches, setBatches] = useState<ApiProductBatch[]>([]);
    const [adjustments, setAdjustments] = useState<ApiStockAdjustment[]>([]);
    const [ledger, setLedger] = useState<ApiInventoryLedger[]>([]);

    // Form states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [p, c, s] = await Promise.all([
                productApi.list(),
                categoryApi.list(),
                supplierApi.list()
            ]);
            setProducts(p);
            setCategories(c);
            setSuppliers(s);
        } catch (err) {
            console.error("Failed to load inventory data", err);
            toast.error("Failed to load inventory data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "adjustments") loadAdjustments();
        if (activeTab === "ledger") loadLedger();
    }, [activeTab]);

    const loadAdjustments = async () => {
        setLoading(true);
        try {
            const data = await adjustmentApi.list();
            setAdjustments(data);
        } finally {
            setLoading(false);
        }
    };

    const loadLedger = async () => {
        setLoading(true);
        try {
            const data = await ledgerApi.list();
            setLedger(data);
        } finally {
            setLoading(false);
        }
    };

    const handleEditProduct = (product: ApiProduct) => {
        setEditingItem(product);
        setIsFormOpen(true);
    };

    const handleViewBatches = (productId: string) => {
        setSelectedProductId(productId);
        setActiveTab("batches");
        loadBatches(productId);
    };

    const handleDeleteProduct = async (id: string) => {
        if (confirm("Delete this product and all its history?")) {
            try {
                await productApi.delete(id);
                setProducts(prev => prev.filter(p => p.id !== id));
                toast.success("Product deleted.");
            } catch {
                toast.error("Failed to delete product.");
            }
        }
    };





    const handleToggleCategoryStatus = async (category: ApiCategory) => {
        const newStatus = !category.is_active;
        if (confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this category?`)) {
            try {
                await categoryApi.update(category.id, { is_active: newStatus });
                setCategories(categories.map(c => c.id === category.id ? { ...c, is_active: newStatus } : c));
                toast.success(`Category ${newStatus ? 'activated' : 'deactivated'}.`);
            } catch {
                toast.error("Failed to update category status.");
            }
        }
    };

    const handleToggleSupplierStatus = async (supplier: ApiSupplier) => {
        const newStatus = !supplier.is_active;
        if (confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this supplier?`)) {
            await supplierApi.update(supplier.id, { is_active: newStatus });
            setSuppliers(suppliers.map(s => s.id === supplier.id ? { ...s, is_active: newStatus } : s));
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const name = p.name || "";
            const generic = p.generic_name || "";
            const sku = p.sku || "";
            const query = searchQuery.toLowerCase();
            return name.toLowerCase().includes(query) ||
                generic.toLowerCase().includes(query) ||
                sku.toLowerCase().includes(query);
        });
    }, [products, searchQuery]);

    const tabs = [
        { id: "products", name: "Products", icon: PackageSearch },
        { id: "batches", name: "Stock Batches", icon: Filter },
        { id: "categories", name: "Categories", icon: Layers },
        { id: "suppliers", name: "Suppliers", icon: Users },
        { id: "adjustments", name: "Adjustments", icon: ArrowRightLeft },
        { id: "ledger", name: "Ledger", icon: History },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Inventory</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage products, stock levels, categories and audit trails.
                    </p>
                </div>
                {!isFormOpen && (activeTab === "products" || activeTab === "categories") && (
                    <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="flex-shrink-0">
                        <Plus className="mr-2 h-4 w-4" /> Add {activeTab === "products" ? "Product" : "Category"}
                    </Button>
                )}
                {activeTab === "suppliers" && (
                    <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="flex-shrink-0">
                        <Plus className="mr-2 h-4 w-4" /> Add Supplier
                    </Button>
                )}
                {activeTab === "adjustments" && (
                    <Button onClick={() => setIsFormOpen(true)} className="flex-shrink-0">
                        <ArrowRightLeft className="mr-2 h-4 w-4" /> New Adjustment
                    </Button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as TabType); setIsFormOpen(false); }}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id
                            ? "border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/10"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.name}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {(isFormOpen && activeTab !== "batches") ? (
                    <div className="animate-in slide-in-from-top-4 duration-300">
                        {activeTab === "products" && (
                            <ProductForm
                                initialData={editingItem}
                                categories={categories}
                                onSubmit={async (data) => {
                                    if (editingItem) {
                                        await productApi.update(editingItem.id, data);
                                    } else {
                                        await productApi.create(data);
                                    }
                                    setIsFormOpen(false);
                                    loadInitialData();
                                }}
                                onCancel={() => setIsFormOpen(false)}
                            />
                        )}
                        {activeTab === "categories" && (
                            <CategoryForm
                                initialData={editingItem}
                                categories={categories}
                                onSubmit={async (data) => {
                                    if (editingItem) {
                                        await categoryApi.update(editingItem.id, data);
                                    } else {
                                        await categoryApi.create(data);
                                    }
                                    setIsFormOpen(false);
                                    loadInitialData();
                                }}
                                onCancel={() => setIsFormOpen(false)}
                            />
                        )}
                        {activeTab === "suppliers" && (
                            <SupplierForm
                                initialData={editingItem}
                                onSubmit={async (data) => {
                                    if (editingItem) {
                                        await supplierApi.update(editingItem.id, data);
                                    } else {
                                        await supplierApi.create(data);
                                    }
                                    setIsFormOpen(false);
                                    loadInitialData();
                                }}
                                onCancel={() => setIsFormOpen(false)}
                            />
                        )}
                        {activeTab === "adjustments" && (
                            <StockAdjustmentForm
                                products={products}
                                onSave={async (data) => {
                                    await adjustmentApi.create(data);
                                    setIsFormOpen(false);
                                    loadAdjustments();
                                }}
                                onCancel={() => setIsFormOpen(false)}
                            />
                        )}
                    </div>
                ) : (
                    <>
                        {activeTab === "products" && (
                            <Card>
                                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
                                    <CardTitle className="text-xl font-semibold">Product Catalog</CardTitle>
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                        <Input
                                            type="search"
                                            placeholder="Search products..."
                                            className="pl-8"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="py-10 text-center text-slate-400">Loading products...</div>
                                    ) : filteredProducts.length === 0 ? (
                                        <div className="py-10 text-center text-slate-500">No products found.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs uppercase bg-slate-50 text-slate-500 dark:bg-slate-900/50">
                                                    <tr>
                                                        <th className="px-4 py-3 font-medium">Name / Generic</th>
                                                        <th className="px-4 py-3 font-medium">Category / Type</th>
                                                        <th className="px-4 py-3 font-medium text-right">Selling Price ({getCurrencySymbol()})</th>
                                                        <th className="px-4 py-3 font-medium text-right">In Stock</th>
                                                        <th className="px-4 py-3 font-medium text-center">Status</th>
                                                        <th className="px-4 py-3 font-medium text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                                    {filteredProducts.map(p => (
                                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <div className="font-medium text-slate-900 dark:text-slate-100">{p.name}</div>
                                                                <div className="text-xs text-slate-500 italic mt-0.5">{p.generic_name || "—"}</div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-slate-600 dark:text-slate-400">{p.category?.name || "Uncategorized"}</div>
                                                                <div className="text-[10px] uppercase font-semibold text-slate-400 mt-1">{p.medicine_type || "N/A"}</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                                                                {getSellingPriceRange(p)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${calculateStock(p) < 10 ? "text-red-600 bg-red-100" : "text-slate-600 bg-slate-100"
                                                                    }`}>
                                                                    {calculateStock(p)}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${p.is_active ? "text-emerald-700 bg-emerald-100" : "text-slate-500 bg-slate-100"}`}>
                                                                    {p.is_active ? "Active" : "Inactive"}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <div className="flex justify-center space-x-1">
                                                                    <Button variant="ghost" size="icon" title="View Batches" onClick={() => handleViewBatches(p.id)}>
                                                                        <Package className="h-4 w-4 text-emerald-500" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" onClick={() => handleEditProduct(p)}>
                                                                        <Edit className="h-4 w-4 text-blue-500" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)}>
                                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "categories" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Management: Categories</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                                                <tr>
                                                    <th className="px-4 py-2">Name</th>
                                                    <th className="px-4 py-2">Slug</th>
                                                    <th className="px-4 py-2">Status</th>
                                                    <th className="px-4 py-2 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y dark:divide-slate-800">
                                                {categories.map(c => (
                                                    <tr key={c.id}>
                                                        <td className="px-4 py-3">{c.name}</td>
                                                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{c.slug}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${c.is_active ? "text-emerald-700 bg-emerald-100" : "text-slate-500 bg-slate-100"}`}>
                                                                {c.is_active ? "Active" : "Inactive"}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex justify-center space-x-1">
                                                                <Button variant="ghost" size="icon" onClick={() => handleToggleCategoryStatus(c)} title={c.is_active ? "Deactivate" : "Activate"} className={c.is_active ? "text-amber-500 hover:text-amber-600" : "text-emerald-500 hover:text-emerald-600"}>
                                                                    <Power className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => { setEditingItem(c); setIsFormOpen(true); }} title="Edit">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "suppliers" && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Management: Suppliers</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                                                <tr>
                                                    <th className="px-4 py-2">Vendor Name</th>
                                                    <th className="px-4 py-2">Contact</th>
                                                    <th className="px-4 py-2">Phone</th>
                                                    <th className="px-4 py-2">Status</th>
                                                    <th className="px-4 py-2 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y dark:divide-slate-800">
                                                {suppliers.map(s => (
                                                    <tr key={s.id}>
                                                        <td className="px-4 py-3 font-medium">{s.name}</td>
                                                        <td className="px-4 py-3">{s.contact_person || "—"}</td>
                                                        <td className="px-4 py-3">{s.phone || "—"}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${s.is_active ? "text-emerald-700 bg-emerald-100" : "text-slate-500 bg-slate-100"}`}>
                                                                {s.is_active ? "Active" : "Inactive"}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex justify-center space-x-1">
                                                                <Button variant="ghost" size="icon" onClick={() => handleToggleSupplierStatus(s)} title={s.is_active ? "Deactivate" : "Activate"} className={s.is_active ? "text-amber-500 hover:text-amber-600" : "text-emerald-500 hover:text-emerald-600"}>
                                                                    <Power className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => { setEditingItem(s); setIsFormOpen(true); }} title="Edit">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "ledger" && <LedgerTable data={ledger} loading={loading} />}

                        {activeTab === "adjustments" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Adjustments</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                                                <tr>
                                                    <th className="px-4 py-2">Date & Time</th>
                                                    <th className="px-4 py-2">Product / Batch</th>
                                                    <th className="px-4 py-2 text-center">Type</th>
                                                    <th className="px-4 py-2 text-right">Qty</th>
                                                    <th className="px-4 py-2">Reason / Adjusted By</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y dark:divide-slate-800">
                                                {adjustments.map(a => (
                                                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                                                            {new Date(a.created_at).toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-slate-800 dark:text-slate-200">{a.product?.name}</div>
                                                            {a.batch && (
                                                                <div className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500 w-fit mt-0.5">
                                                                    {a.batch.batch_number}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${(a.type === 'increase' || a.type === 'correction')
                                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                                }`}>
                                                                {(a.type === 'increase' || a.type === 'correction') ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                                                                {a.type.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className={`px-4 py-3 text-right font-bold ${(a.type === 'increase' || a.type === 'correction') ? "text-green-600" : "text-red-600"}`}>
                                                            {(a.type === 'increase' || a.type === 'correction') ? "+" : "-"}{a.quantity}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-1" title={a.reason ?? ""}>
                                                                {a.reason || "No reason provided"}
                                                            </div>
                                                            {a.user && (
                                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                                                    <Users className="h-2.5 w-2.5" /> {a.user.name}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "batches" && (
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">Select Product to View Batches</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <select
                                            value={selectedProductId || ""}
                                            onChange={e => {
                                                const id = e.target.value;
                                                setSelectedProductId(id);
                                                if (id) loadBatches(id);
                                            }}
                                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Choose a product...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </CardContent>
                                </Card>

                                {selectedProductId && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Manage Batches</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {isFormOpen ? (
                                                <BatchForm
                                                    productName={products.find(p => p.id === selectedProductId)?.name || ""}
                                                    suppliers={suppliers}
                                                    initialData={editingItem}
                                                    onSubmit={async (data) => {
                                                        if (editingItem) {
                                                            await productApi.updateBatch(editingItem.id, data);
                                                        } else {
                                                            await productApi.addBatch(selectedProductId!, data);
                                                        }
                                                        setIsFormOpen(false);
                                                        setEditingItem(null);
                                                        loadBatches(selectedProductId!);
                                                        loadInitialData();
                                                    }}
                                                    onCancel={() => {
                                                        setIsFormOpen(false);
                                                        setEditingItem(null);
                                                    }}
                                                />
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                                                            <tr>
                                                                <th className="px-4 py-2">Batch #</th>
                                                                <th className="px-4 py-2">Supplier</th>
                                                                <th className="px-4 py-2">Expiry</th>
                                                                <th className="px-4 py-2 text-right">Stock</th>
                                                                <th className="px-4 py-2 text-right">Vendor Price ({getCurrencySymbol()})</th>
                                                                <th className="px-4 py-2 text-right">Selling Price ({getCurrencySymbol()})</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y dark:divide-slate-800">
                                                            {batches.map(b => (
                                                                <tr key={b.id}>
                                                                    <td className="px-4 py-3 font-mono text-xs">{b.batch_number}</td>
                                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{b.supplier?.name || "Unknown"}</td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={isExpiring(b.expiry_date) ? "text-amber-500 font-bold" : ""}>
                                                                            {new Date(b.expiry_date).toLocaleDateString()}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">{b.quantity}</td>
                                                                    <td className="px-4 py-3 text-right">{formatNumber(b.purchase_price)}</td>
                                                                    <td className="px-4 py-3 text-right">{formatNumber(b.selling_price)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    async function loadBatches(id: string) {
        setLoading(true);
        try {
            const data = await productApi.batches(id);
            setBatches(data);
        } finally {
            setLoading(false);
        }
    }

    function calculateStock(p: ApiProduct) {
        // Simple mock or compute if batches are loaded in p
        return p.batches?.reduce((sum, b) => sum + b.quantity, 0) || 0;
    }

    function isExpiring(date: string) {
        const d = new Date(date);
        const soon = new Date();
        soon.setMonth(soon.getMonth() + 6);
        return d < soon;
    }

    function getSellingPriceRange(p: ApiProduct) {
        if (!p.batches || p.batches.length === 0) return "—";
        const prices = p.batches
            .filter(b => b.is_active && b.quantity > 0)
            .map(b => b.selling_price)
            .filter(price => price != null);

        if (prices.length === 0) return "—";
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === max) return formatNumber(min);
        return `${formatNumber(min)} - ${formatNumber(max)}`;
    }
}
