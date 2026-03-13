import { formatCurrency, formatNumber } from '@/lib/currency';
import React, { useState, useEffect } from "react";
import { ApiSupplier, ApiProduct, supplierApi, productApi } from "@/lib/inventory";
import { ApiPurchase, purchaseApi, ApiPurchaseReturn, purchaseReturnApi } from "@/lib/purchases";
import { PurchaseReturnForm } from "@/components/PurchaseReturnForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NewPurchaseForm } from "@/components/NewPurchaseForm";
import {
    ShoppingCart, Plus, Search, Eye, CheckCircle, XCircle,
    Clock, ChevronLeft, RefreshCw, Truck, Package, Undo2, List, CreditCard
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm } from "@/hooks/useConfirm";
import { authLib } from "@/lib/auth";

type ViewMode = "list" | "new" | "detail" | "return" | "return-list";

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

const PaymentStatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
        pending: "bg-amber-100 text-amber-700",
        paid: "bg-green-100 text-green-700",
        refunded: "bg-purple-100 text-purple-700",
    };
    const icons: Record<string, React.ReactNode> = {
        pending: <Clock className="h-3 w-3 mr-1" />,
        paid: <CheckCircle className="h-3 w-3 mr-1" />,
        refunded: <RefreshCw className="h-3 w-3 mr-1" />,
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
    const [selectedReturn, setSelectedReturn] = useState<ApiPurchaseReturn | null>(null);
    const [loading, setLoading] = useState(true);
    const [returns, setReturns] = useState<ApiPurchaseReturn[]>([]);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterPaymentStatus, setFilterPaymentStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [updatingPayment, setUpdatingPayment] = useState(false);
    const [updatingReturnPayment, setUpdatingReturnPayment] = useState(false);
    const toast = useToast();
    const [ConfirmDialog, confirm] = useConfirm();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pResp, sup, prod, retResp] = await Promise.all([
                purchaseApi.list(),
                supplierApi.list(),
                productApi.list(),
                purchaseReturnApi.list(),
            ]);
            setPurchases(pResp.data || []);
            setSuppliers(sup);
            setProducts(prod);
            setReturns(retResp.data || []);
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
            toast.error("Failed to load purchase details.");
        }
    };

    const handleMarkReceived = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Mark Received?",
            description: "Mark this order as received? This will credit stock.",
            confirmText: "Yes, Mark Received"
        });
        if (!isConfirmed) return;
        setSaving(true);
        try {
            await purchaseApi.markReceived(id);
            toast.success("Purchase marked as received. Stock updated! ✅");
            loadData();
            if (selectedPurchase?.id === id) {
                const refreshed = await purchaseApi.get(id);
                setSelectedPurchase(refreshed);
            }
        } catch {
            toast.error("Failed to update purchase.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Order?",
            description: "Delete this pending purchase order? This cannot be undone.",
            confirmText: "Yes, Delete Order",
            variant: "destructive"
        });
        if (!isConfirmed) return;
        try {
            await purchaseApi.delete(id);
            toast.success("Purchase order deleted.");
            loadData();
            if (view === "detail") setView("list");
        } catch {
            toast.error("Cannot delete — only pending orders can be removed.");
        }
    };

    const handleCreateReturn = async (data: any) => {
        try {
            await purchaseReturnApi.create(data);
            // Form handles its own success toast
            await loadData();
            setView("list");
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const handleCompleteReturn = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Complete Return?",
            description: "Complete this return? This will deduct stock.",
            confirmText: "Yes, Complete Return"
        });
        if (!isConfirmed) return;
        setSaving(true);
        try {
            await purchaseReturnApi.complete(id);
            toast.success("Return completed and stock adjusted! ✅");
            await loadData();
        } catch {
            toast.error("Failed to complete return.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateReturnPaymentStatus = async (id: string, payment_status: 'pending' | 'refunded') => {
        setUpdatingReturnPayment(true);
        try {
            const updated = await purchaseReturnApi.updatePaymentStatus(id, payment_status);
            toast.success(`Return payment status updated to "${payment_status}" ✅`);
            await loadData();
            setSelectedReturn(updated);
        } catch {
            toast.error("Failed to update return payment status.");
        } finally {
            setUpdatingReturnPayment(false);
        }
    };

    const openReturnDetail = async (r: ApiPurchaseReturn) => {
        try {
            const full = await purchaseReturnApi.get(r.id);
            setSelectedReturn(full);
        } catch {
            toast.error("Failed to load return details.");
        }
    };

    const handleUpdatePaymentStatus = async (id: string, payment_status: 'pending' | 'paid' | 'partial' | 'refunded') => {
        setUpdatingPayment(true);
        try {
            await purchaseApi.updatePaymentStatus(id, payment_status);
            toast.success(`Payment status updated to "${payment_status}" ✅`);
            await loadData();
            if (selectedPurchase?.id === id) {
                const refreshed = await purchaseApi.get(id);
                setSelectedPurchase(refreshed);
            }
        } catch {
            toast.error("Failed to update payment status.");
        } finally {
            setUpdatingPayment(false);
        }
    };

    const filteredPurchases = purchases.filter(p => {
        const s = search.toLowerCase();
        const matchesSearch = p.purchase_number.toLowerCase().includes(s) ||
            (p.supplier?.name || "").toLowerCase().includes(s);
        const matchesStatus = !filterStatus || p.status === filterStatus;
        const matchesPayment = !filterPaymentStatus || p.payment_status === filterPaymentStatus;
        return matchesSearch && matchesStatus && matchesPayment;
    });

    const stats = {
        total: purchases.length,
        pending: purchases.filter(p => p.status === 'pending').length,
        received: purchases.filter(p => p.status === 'received').length,
        totalValue: purchases.filter(p => p.status === 'received').reduce((s, p) => s + Number(p.total), 0),
        pendingReturns: returns.filter(r => r.status === 'pending').length,
        unpaid: purchases.filter(p => p.payment_status === 'pending').length,
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
                        // Form handles its own success toast
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
                    <div className="flex items-center gap-2">
                        <StatusBadge status={p.status} />
                        <PaymentStatusBadge status={p.payment_status} />
                    </div>
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
                    <div className="flex flex-wrap gap-2 items-center">
                        {/* Payment Status Updater — Purchase: pending | paid */}
                        <div className="flex items-center gap-1.5">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            {p.payment_status === 'paid' ? (
                                <span className="inline-flex items-center gap-1 h-8 rounded-md border border-green-300 bg-green-50 dark:bg-green-900/20 px-2 text-xs font-semibold text-green-700 dark:text-green-400">
                                    <CheckCircle className="h-3 w-3" /> Paid — locked
                                </span>
                            ) : (
                                <select
                                    value={p.payment_status}
                                    disabled={updatingPayment}
                                    onChange={e => handleUpdatePaymentStatus(p.id, e.target.value as any)}
                                    className="h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <option value="pending">Unpaid</option>
                                    <option value="paid">Paid</option>
                                </select>
                            )}
                        </div>
                        {p.status === 'pending' && (
                            <>
                                <Button onClick={() => handleMarkReceived(p.id)} disabled={saving} className="bg-green-600 hover:bg-green-700">
                                    <Truck className="h-4 w-4 mr-2" /> Mark Received
                                </Button>
                                <Button variant="outline" onClick={() => handleDelete(p.id)} className="text-red-500 border-red-300 hover:bg-red-50">
                                    <XCircle className="h-4 w-4 mr-2" /> Cancel Order
                                </Button>
                            </>
                        )}
                        {p.status === 'received' && (
                            <Button onClick={() => {
                                setSelectedPurchase(p);
                                setView("return");
                            }} variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50">
                                <Undo2 className="h-4 w-4 mr-2" /> Return Items
                            </Button>
                        )}
                    </div>
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
                                            <td className="px-4 py-3 text-right">{formatCurrency(Number(item.purchase_price))}</td>
                                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(item.total))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-right space-y-1">
                            <div className="text-sm text-slate-500">Subtotal: <span className="font-medium">{formatCurrency(Number(p.subtotal))}</span></div>
                            {Number(p.discount) > 0 && <div className="text-sm text-slate-500">Discount: <span className="text-red-500">-{formatCurrency(Number(p.discount))}</span></div>}
                            {Number(p.tax) > 0 && <div className="text-sm text-slate-500">Tax: <span className="text-amber-500">+{formatCurrency(Number(p.tax))}</span></div>}
                            <div className="text-xl font-bold text-slate-900 dark:text-white">Total: {formatCurrency(Number(p.total))}</div>
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

    if (view === "return" && selectedPurchase) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView("detail")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                        <ChevronLeft className="h-4 w-4" /> Back to Detail
                    </button>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Return Items</h1>
                <PurchaseReturnForm
                    purchase={selectedPurchase}
                    onSubmit={handleCreateReturn}
                    onCancel={() => setView("detail")}
                />
            </div>
        );
    }

    if (view === "return-list") {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                        <ChevronLeft className="h-4 w-4" /> Back to Purchases
                    </button>
                    <h1 className="text-2xl font-bold">Purchase Returns</h1>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {returns.length === 0 ? (
                            <div className="py-16 text-center text-slate-400">No returns found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-5 py-3">Return #</th>
                                            <th className="px-5 py-3">Purchase #</th>
                                            <th className="px-5 py-3">Supplier</th>
                                            <th className="px-5 py-3">Status</th>
                                            <th className="px-5 py-3">Payment</th>
                                            <th className="px-5 py-3 text-right">TOTAL (MMK)</th>
                                            <th className="px-5 py-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {returns.map(r => (
                                            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                                <td className="px-5 py-3.5 font-mono text-xs font-medium text-amber-600">{r.return_number}</td>
                                                <td className="px-5 py-3.5 text-xs text-slate-500">{r.purchase?.purchase_number || "—"}</td>
                                                <td className="px-5 py-3.5 font-medium">{r.supplier?.name || "—"}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <PaymentStatusBadge status={r.payment_status} />
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-semibold">{formatNumber(Number(r.total))}</td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex justify-center gap-1">
                                                        <Button variant="ghost" size="icon" title="View Detail" onClick={() => openReturnDetail(r)}>
                                                            <Eye className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                        {r.status === 'pending' && (
                                                            <Button variant="ghost" size="sm" onClick={() => handleCompleteReturn(r.id)} disabled={saving} className="text-green-600">
                                                                Complete
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

                {/* Return Detail Modal */}
                {selectedReturn && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedReturn(null)}>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white font-mono">{selectedReturn.return_number}</h2>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase ${selectedReturn.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>{selectedReturn.status}</span>
                                        <PaymentStatusBadge status={selectedReturn.payment_status} />
                                    </div>
                                </div>
                                <button onClick={() => setSelectedReturn(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-2xl leading-none">&times;</button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Meta info */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Purchase Order</p>
                                        <p className="font-mono font-medium text-blue-600">{selectedReturn.purchase?.purchase_number || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Supplier</p>
                                        <p className="font-medium">{selectedReturn.supplier?.name || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Date</p>
                                        <p>{new Date(selectedReturn.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Returned By</p>
                                        <p>{selectedReturn.returnedBy?.name || "—"}</p>
                                    </div>
                                    {selectedReturn.reason && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Reason</p>
                                            <p className="text-slate-600 dark:text-slate-300">{selectedReturn.reason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Items table */}
                                {selectedReturn.items && selectedReturn.items.length > 0 && (
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Return Items ({selectedReturn.items.length})</p>
                                        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                                                    <tr>
                                                        <th className="px-3 py-2">Product</th>
                                                        <th className="px-3 py-2 text-right">Qty</th>
                                                        <th className="px-3 py-2 text-right">Price</th>
                                                        <th className="px-3 py-2 text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {selectedReturn.items.map((item, i) => (
                                                        <tr key={i}>
                                                            <td className="px-3 py-2.5 font-medium">{item.product?.name || "—"}</td>
                                                            <td className="px-3 py-2.5 text-right">{item.quantity}</td>
                                                            <td className="px-3 py-2.5 text-right">{formatCurrency(Number(item.price))}</td>
                                                            <td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(Number(item.total))}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="text-right mt-2">
                                            <span className="text-xl font-bold text-slate-900 dark:text-white">Total: {formatCurrency(Number(selectedReturn.total))}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Status Update */}
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Payment Status</p>
                                    {selectedReturn.payment_status === 'refunded' ? (
                                        <div className="flex items-center gap-2">
                                            <PaymentStatusBadge status="refunded" />
                                            <span className="text-xs text-purple-600 font-medium">Locked — cannot revert to pending</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <PaymentStatusBadge status={selectedReturn.payment_status} />
                                            <Button
                                                size="sm"
                                                disabled={updatingReturnPayment}
                                                onClick={() => handleUpdateReturnPaymentStatus(selectedReturn.id, 'refunded')}
                                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                            >
                                                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                                Mark Refunded
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── List view ────────────────────────────────────────────────────

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Purchases</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage purchase orders and supplier deliveries.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setView("return-list")} className="flex-shrink-0">
                        <List className="mr-2 h-4 w-4" /> View Returns
                    </Button>
                    <Button onClick={() => setView("new")} className="flex-shrink-0">
                        <Plus className="mr-2 h-4 w-4" /> New Purchase Order
                    </Button>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
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
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                <CreditCard className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Unpaid</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.unpaid}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                                <Undo2 className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Pending Returns</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingReturns}</p>
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
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalValue)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
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
                    <option value="">All Order Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="received">Received</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <select
                    value={filterPaymentStatus}
                    onChange={e => setFilterPaymentStatus(e.target.value)}
                    className="h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Payment Statuses</option>
                    <option value="pending">Unpaid</option>
                    <option value="paid">Paid</option>
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
                                        <th className="px-5 py-3">Payment</th>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3 text-right">TOTAL (MMK)</th>
                                        <th className="px-5 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {filteredPurchases.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                            <td className="px-5 py-3.5 font-mono text-xs font-medium text-blue-600 dark:text-blue-400">{p.purchase_number}</td>
                                            <td className="px-5 py-3.5 font-medium">{p.supplier?.name || "—"}</td>
                                            <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                                            <td className="px-5 py-3.5"><PaymentStatusBadge status={p.payment_status} /></td>
                                            <td className="px-5 py-3.5 text-slate-500 text-xs">
                                                {p.purchased_at ? new Date(p.purchased_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-semibold">{formatNumber(Number(p.total))}</td>
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

            <ConfirmDialog />
        </div>
    );
}
