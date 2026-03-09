import { useState, useEffect } from "react";
import { ApiSupplier, ApiProduct, supplierApi, productApi } from "@/lib/inventory";
import { ApiPurchase, purchaseApi } from "@/lib/purchases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NewPurchaseForm } from "@/components/NewPurchaseForm";
import {
    ShoppingCart, Plus, Search, Eye, CheckCircle, XCircle,
    Clock, ChevronLeft, RefreshCw, Truck, Package
} from "lucide-react";

type ViewMode = "list" | "new" | "detail";

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
        pending: "bg-amber-100 text-amber-700",
        received: "bg-green-100 text-green-700",
        cancelled: "bg-red-100 text-red-700",
    };
    const icons: Record<string, React.ReactNode> = {
        pending: <Clock className="h-3 w-3 mr-1" />,
        received: <CheckCircle className="h-3 w-3 mr-1" />,
        cancelled: <XCircle className="h-3 w-3 mr-1" />,
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${map[status] || "bg-slate-100 text-slate-600"}`}>
            {icons[status]}{status}
        </span>
    );
};

export default function PurchasesPage() {
    const [view, setView] = useState<ViewMode>("list");
    const [purchases, setPurchases] = useState<ApiPurchase[]>([]);
    const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [selectedPurchase, setSelectedPurchase] = useState<ApiPurchase | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [pResp, sup, prod] = await Promise.all([
                purchaseApi.list(),
                supplierApi.list(),
                productApi.list(),
            ]);
            setPurchases(pResp.data || []);
            setSuppliers(sup);
            setProducts(prod);
        } catch (e) {
            console.error("Failed to load purchases", e);
        } finally {
            setLoading(false);
        }
    };

    const openDetail = async (p: ApiPurchase) => {
        try {
            const full = await purchaseApi.get(p.id);
            setSelectedPurchase(full);
            setView("detail");
        } catch {
            showToast("Failed to load purchase details.", "error");
        }
    };

    const handleMarkReceived = async (id: string) => {
        if (!confirm("Mark this order as received? This will credit stock.")) return;
        setSaving(true);
        try {
            await purchaseApi.markReceived(id);
            showToast("Purchase marked as received. Stock updated! ✅");
            loadData();
            if (selectedPurchase?.id === id) {
                const refreshed = await purchaseApi.get(id);
                setSelectedPurchase(refreshed);
            }
        } catch {
            showToast("Failed to update purchase.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this pending purchase order?")) return;
        try {
            await purchaseApi.delete(id);
            showToast("Purchase order deleted.");
            loadData();
            if (view === "detail") setView("list");
        } catch {
            showToast("Cannot delete — only pending orders can be removed.", "error");
        }
    };

    const filteredPurchases = purchases.filter(p => {
        const s = search.toLowerCase();
        const matchesSearch = p.purchase_number.toLowerCase().includes(s) ||
            (p.supplier?.name || "").toLowerCase().includes(s);
        const matchesStatus = !filterStatus || p.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: purchases.length,
        pending: purchases.filter(p => p.status === 'pending').length,
        received: purchases.filter(p => p.status === 'received').length,
        totalValue: purchases.filter(p => p.status === 'received').reduce((s, p) => s + Number(p.total), 0),
    };

    // ─── Views ──────────────────────────────────────────────────────────

    if (view === "new") {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                        <ChevronLeft className="h-4 w-4" /> Back to Purchases
                    </button>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">New Purchase Order</h1>
                <NewPurchaseForm
                    suppliers={suppliers}
                    products={products}
                    onSubmit={async (data) => {
                        await purchaseApi.create(data);
                        showToast("Purchase order created! 🎉");
                        await loadData();
                        setView("list");
                    }}
                    onCancel={() => setView("list")}
                />
            </div>
        );
    }

    if (view === "detail" && selectedPurchase) {
        const p = selectedPurchase;
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                        <ChevronLeft className="h-4 w-4" /> Back to Purchases
                    </button>
                    <StatusBadge status={p.status} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{p.purchase_number}</h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Supplier: <span className="font-medium text-slate-700 dark:text-slate-300">{p.supplier?.name || "—"}</span>
                            {p.purchased_at && <> · Ordered: <span className="font-medium">{new Date(p.purchased_at).toLocaleDateString()}</span></>}
                            {p.received_at && <> · Received: <span className="text-green-600 font-medium">{new Date(p.received_at).toLocaleDateString()}</span></>}
                        </p>
                    </div>
                    {p.status === 'pending' && (
                        <div className="flex gap-2">
                            <Button onClick={() => handleMarkReceived(p.id)} disabled={saving} className="bg-green-600 hover:bg-green-700">
                                <Truck className="h-4 w-4 mr-2" /> Mark Received
                            </Button>
                            <Button variant="outline" onClick={() => handleDelete(p.id)} className="text-red-500 border-red-300 hover:bg-red-50">
                                <XCircle className="h-4 w-4 mr-2" /> Cancel Order
                            </Button>
                        </div>
                    )}
                </div>

                {/* Items table */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Order Items ({p.items?.length || 0})</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Product</th>
                                        <th className="px-4 py-3">Batch</th>
                                        <th className="px-4 py-3">Expiry</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                        <th className="px-4 py-3 text-right">Unit Price</th>
                                        <th className="px-4 py-3 text-right">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {p.items?.map((item, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{item.product?.name}</div>
                                                <div className="text-xs text-slate-400 italic">{item.product?.generic_name}</div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                                                {item.batch?.batch_number || item.batch_number || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                {item.batch?.expiry_date || item.expiry_date
                                                    ? new Date(item.batch?.expiry_date || item.expiry_date!).toLocaleDateString()
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right">{Number(item.purchase_price).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right font-medium">{Number(item.total).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-right space-y-1">
                            <div className="text-sm text-slate-500">Subtotal: <span className="font-medium">{Number(p.subtotal).toFixed(2)}</span></div>
                            {Number(p.discount) > 0 && <div className="text-sm text-slate-500">Discount: <span className="text-red-500">-{Number(p.discount).toFixed(2)}</span></div>}
                            {Number(p.tax) > 0 && <div className="text-sm text-slate-500">Tax: <span className="text-amber-500">+{Number(p.tax).toFixed(2)}</span></div>}
                            <div className="text-xl font-bold text-slate-900 dark:text-white">Total: {Number(p.total).toFixed(2)}</div>
                        </div>
                    </CardContent>
                </Card>

                {p.notes && (
                    <Card>
                        <CardContent className="pt-4">
                            <p className="text-sm text-slate-500"><span className="font-medium text-slate-700 dark:text-slate-300">Notes:</span> {p.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }

    // ─── List view ────────────────────────────────────────────────────

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-top duration-300 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Purchases</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage purchase orders and supplier deliveries.</p>
                </div>
                <Button onClick={() => setView("new")} className="flex-shrink-0">
                    <Plus className="mr-2 h-4 w-4" /> New Purchase Order
                </Button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <ShoppingCart className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Total Orders</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Pending</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                <Package className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Received</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.received}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <Truck className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Total Purchase Value</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalValue.toFixed(0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        className="pl-9"
                        placeholder="Search by PO# or supplier…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="received">Received</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <Button variant="outline" onClick={loadData} title="Refresh">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="py-16 text-center text-slate-400">Loading purchases…</div>
                    ) : filteredPurchases.length === 0 ? (
                        <div className="py-16 text-center">
                            <ShoppingCart className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                            <p className="text-slate-500">No purchase orders found.</p>
                            <p className="text-xs text-slate-400 mt-1">Click "New Purchase Order" to get started.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-5 py-3">PO Number</th>
                                        <th className="px-5 py-3">Supplier</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3 text-right">Total</th>
                                        <th className="px-5 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {filteredPurchases.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                            <td className="px-5 py-3.5 font-mono text-xs font-medium text-blue-600 dark:text-blue-400">{p.purchase_number}</td>
                                            <td className="px-5 py-3.5 font-medium">{p.supplier?.name || "—"}</td>
                                            <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                                            <td className="px-5 py-3.5 text-slate-500 text-xs">
                                                {p.purchased_at ? new Date(p.purchased_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-semibold">{Number(p.total).toFixed(2)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex justify-center gap-1">
                                                    <Button variant="ghost" size="icon" title="View Details" onClick={() => openDetail(p)}>
                                                        <Eye className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                    {p.status === 'pending' && (
                                                        <Button variant="ghost" size="icon" title="Mark Received" onClick={() => handleMarkReceived(p.id)} disabled={saving}>
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        </Button>
                                                    )}
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
        </div>
    );
}
