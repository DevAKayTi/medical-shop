import { useState, useEffect, useMemo } from "react";
import { authLib } from "@/lib/auth";
import { formatNumber, getCurrencySymbol } from "@/lib/currency";
import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm } from "@/hooks/useConfirm";
import {
    ApiProduct, ApiCategory, ApiSupplier, ApiStockAdjustment, ApiInventoryLedger,
    productApi, categoryApi, supplierApi, adjustmentApi, ledgerApi
} from "@/lib/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    PackageSearch, Layers, Users, History, ArrowRightLeft,
    Plus, Edit, Trash2, Search, Power,
    ArrowUpRight, ArrowDownRight, Eye
} from "lucide-react";

import { AddButton } from "@/components/ui/IconButton";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { ProductForm } from "@/components/ProductForm";
import { ProductView } from "@/components/ProductView";
import { CategoryForm } from "@/components/inventory/CategoryForm";
import { SupplierForm } from "@/components/inventory/SupplierForm";
import { StockAdjustmentForm } from "@/components/inventory/StockAdjustmentForm";
import { LedgerTable } from "@/components/inventory/LedgerTable";

type TabType = "products" | "categories" | "suppliers" | "adjustments" | "ledger";

export default function InventoryPage() {
    const toast = useToast();
    const [ConfirmDialog, confirm] = useConfirm();
    const [activeTab, setActiveTab] = useState<TabType>("products");
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Data states
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
    const [adjustments, setAdjustments] = useState<ApiStockAdjustment[]>([]);
    const [ledger, setLedger] = useState<ApiInventoryLedger[]>([]);

    // Form states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isViewOnly, setIsViewOnly] = useState(false);

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
        setIsViewOnly(false);
        setIsFormOpen(true);
    };

    const handleViewProduct = (product: ApiProduct) => {
        setEditingItem(product);
        setIsViewOnly(true);
        setIsFormOpen(true);
    };


    const handleDeleteProduct = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Product?",
            description: "Delete this product and all its history? This action cannot be undone.",
            confirmText: "Yes, Delete Product",
            variant: "destructive"
        });
        if (isConfirmed) {
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
        const isConfirmed = await confirm({
            title: `${newStatus ? 'Activate' : 'Deactivate'} Category?`,
            description: `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this category?`,
            confirmText: `Yes, ${newStatus ? 'Activate' : 'Deactivate'} Category`
        });
        if (isConfirmed) {
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
        const isConfirmed = await confirm({
            title: `${newStatus ? 'Activate' : 'Deactivate'} Supplier?`,
            description: `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this supplier?`,
            confirmText: `Yes, ${newStatus ? 'Activate' : 'Deactivate'} Supplier`
        });
        if (isConfirmed) {
            try {
                await supplierApi.update(supplier.id, { phone: supplier.phone, is_active: newStatus });
                setSuppliers(suppliers.map(s => s.id === supplier.id ? { ...s, is_active: newStatus } : s));
                toast.success(`Supplier ${newStatus ? 'activated' : 'deactivated'}.`);
            } catch {
                toast.error("Failed to update supplier status.");
            }


        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;

            const name = p.name || "";
            const generic = p.generic_name || "";
            const sku = p.sku || "";
            const query = searchQuery.toLowerCase();
            const matchesQuery = name.toLowerCase().includes(query) ||
                generic.toLowerCase().includes(query) ||
                sku.toLowerCase().includes(query);

            return matchesCategory && matchesQuery;
        });
    }, [products, searchQuery, selectedCategory]);

    const tabs = [
        { id: "products", name: "Products", icon: PackageSearch },
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
                {!isFormOpen && (activeTab === "products" || activeTab === "categories") && authLib.hasPermission('create-catalog') && (
                    <div className="flex items-center gap-3">
                        <AddButton
                            onClick={() => { setEditingItem(null); setIsViewOnly(false); setIsFormOpen(true); }}
                            className="flex-shrink-0 shadow-lg shadow-indigo-500/20"
                            title={`Add ${activeTab === "products" ? "Product" : "Category"}`}
                            icon={<Plus aria-hidden="true" className="size-5" />}
                        />
                    </div>
                )}
                {!isFormOpen && activeTab === "suppliers" && authLib.hasPermission('create-suppliers') && (
                    <div className="flex items-center gap-3">
                        <AddButton
                            onClick={() => { setEditingItem(null); setIsFormOpen(true); }}
                            className="flex-shrink-0 shadow-lg shadow-indigo-500/20"
                            title="Add Supplier"
                            icon={<Plus aria-hidden="true" className="size-5" />}
                        />
                    </div>
                )}
                {!isFormOpen && activeTab === "adjustments" && authLib.hasPermission('adjust-stock') && (
                    <div className="flex items-center gap-3">
                        <AddButton
                            onClick={() => { setEditingItem(null); setIsFormOpen(true); }}
                            className="flex-shrink-0 shadow-lg shadow-indigo-500/20"
                            title="Add Adjustment"
                            icon={<ArrowRightLeft aria-hidden="true" className="size-5" />}
                        />
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as TabType); setIsFormOpen(false); }}
                        className={`flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium transition-all rounded-md flex-shrink-0 ${activeTab === tab.id
                            ? "bg-emerald-600 text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{tab.name}</span>
                        <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {isFormOpen ? (
                    <div className="animate-in slide-in-from-top-4 duration-300">
                        {activeTab === "products" && (
                            isViewOnly ? (
                                <ProductView
                                    product={editingItem}
                                    categories={categories}
                                    onClose={() => setIsFormOpen(false)}
                                />
                            ) : (
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
                            )
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
                                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4">
                                    <CardTitle className="text-xl font-semibold">Product Catalog</CardTitle>
                                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                        <div className="w-full sm:w-48 z-10">
                                            <SelectMenu
                                                value={selectedCategory}
                                                onChange={setSelectedCategory}
                                                options={[
                                                    { value: "all", label: "All Categories" },
                                                    ...categories.map(c => ({ value: c.id, label: c.name }))
                                                ]}
                                            />
                                        </div>
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
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="py-10 text-center text-slate-400">Loading products...</div>
                                    ) : filteredProducts.length === 0 ? (
                                        <div className="py-10 text-center text-slate-500">No products found.</div>
                                    ) : (
                                        <>
                                            {/* Mobile card view */}
                                            <div className="md:hidden space-y-3">
                                                {filteredProducts.map(p => (
                                                    <div key={p.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
                                                                <p className="text-xs text-slate-500 italic">{p.generic_name || "—"}</p>
                                                            </div>
                                                            <span className={`flex-shrink-0 inline-flex px-2 py-0.5 rounded text-xs font-bold ${p.is_active ? "text-emerald-700 bg-emerald-100" : "text-slate-500 bg-slate-100"}`}>
                                                                {p.is_active ? "Active" : "Inactive"}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                                            <span>Category: <span className="text-slate-700 dark:text-slate-300">{p.category?.name || "Uncategorized"}</span></span>
                                                            <span>Price: <span className="font-medium text-slate-700 dark:text-slate-300">{getSellingPriceRange(p)} {getCurrencySymbol()}</span></span>
                                                            <span>Stock: <span className={`font-bold ${calculateStock(p) < 10 ? "text-red-600" : "text-slate-700 dark:text-slate-300"}`}>{calculateStock(p)}</span></span>
                                                        </div>
                                                        <div className="flex gap-2 pt-1">
                                                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleViewProduct(p)}>
                                                                <Eye className="h-3 w-3 mr-1 text-slate-500" /> View
                                                            </Button>
                                                            {authLib.hasPermission('update-catalog') && (
                                                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleEditProduct(p)}>
                                                                    <Edit className="h-3 w-3 mr-1 text-blue-500" /> Edit
                                                                </Button>
                                                            )}
                                                            {authLib.hasPermission('delete-catalog') && (
                                                                <Button variant="outline" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600" onClick={() => handleDeleteProduct(p.id)}>
                                                                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Desktop table view */}
                                            <div className="hidden md:block overflow-x-auto">
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
                                                                        <Button variant="ghost" size="icon" title="View Product" onClick={() => handleViewProduct(p)}>
                                                                            <Eye className="h-4 w-4 text-slate-500" />
                                                                        </Button>
                                                                        {authLib.hasPermission('update-catalog') && (
                                                                            <Button variant="ghost" size="icon" onClick={() => handleEditProduct(p)}>
                                                                                <Edit className="h-4 w-4 text-blue-500" />
                                                                            </Button>
                                                                        )}
                                                                        {authLib.hasPermission('delete-catalog') && (
                                                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)}>
                                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
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
                                                                {authLib.hasPermission('update-catalog') && (
                                                                    <>
                                                                        <Button variant="ghost" size="icon" onClick={() => handleToggleCategoryStatus(c)} title={c.is_active ? "Deactivate" : "Activate"} className={c.is_active ? "text-amber-500 hover:text-amber-600" : "text-emerald-500 hover:text-emerald-600"}>
                                                                            <Power className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" onClick={() => { setEditingItem(c); setIsFormOpen(true); }} title="Edit">
                                                                            <Edit className="h-4 w-4 text-blue-500" />
                                                                        </Button>
                                                                    </>
                                                                )}
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
                                                                {authLib.hasPermission('update-suppliers') && (
                                                                    <>
                                                                        <Button variant="ghost" size="icon" onClick={() => handleToggleSupplierStatus(s)} title={s.is_active ? "Deactivate" : "Activate"} className={s.is_active ? "text-amber-500 hover:text-amber-600" : "text-emerald-500 hover:text-emerald-600"}>
                                                                            <Power className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" onClick={() => { setEditingItem(s); setIsFormOpen(true); }} title="Edit">
                                                                            <Edit className="h-4 w-4 text-blue-500" />
                                                                        </Button>
                                                                    </>
                                                                )}
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
                    </>
                )}
            </div>
            <ConfirmDialog />
        </div>
    );


    function calculateStock(p: ApiProduct) {
        // Simple mock or compute if batches are loaded in p
        return p.batches?.reduce((sum, b) => sum + b.quantity, 0) || 0;
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
