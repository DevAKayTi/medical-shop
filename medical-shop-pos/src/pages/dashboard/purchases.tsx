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
    Clock, ChevronLeft, RefreshCw, Package, Undo2, List, CreditCard, ChevronDown, Check
} from "lucide-react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm } from "@/hooks/useConfirm";
import { AddButton } from "@/components/ui/IconButton";
import { IconCard } from "@/components/ui/IconCard";

type ViewMode = "list" | "new" | "detail" | "return";
type TabMode = "purchases" | "returns";

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
        unpaid: "bg-amber-100 text-amber-700",
        paid: "bg-green-100 text-green-700",
        partial: "bg-blue-100 text-blue-700",
    };
    const icons: Record<string, React.ReactNode> = {
        unpaid: <Clock className="h-3 w-3 mr-1" />,
        paid: <CheckCircle className="h-3 w-3 mr-1" />,
        partial: <CreditCard className="h-3 w-3 mr-1" />,
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${map[status] || "bg-slate-100 text-slate-600"}`}>
            {icons[status]}{status}
        </span>
    );
};

const paymentOptions = [
    {
        id: 'unpaid',
        title: 'Unpaid',
        description: 'No payment has been made yet for this order.',
        bgClass: 'bg-amber-600 dark:bg-amber-500',
        hoverClass: 'hover:bg-amber-700 dark:hover:bg-amber-600',
        ringClass: 'focus-visible:outline-amber-400 dark:focus-visible:outline-amber-400',
        borderClass: 'border-amber-700/30 dark:border-amber-600/30',
        focusBgClass: 'data-[focus]:bg-amber-600 dark:data-[focus]:bg-amber-500',
        iconClass: 'text-amber-600 dark:text-amber-400'
    },
    {
        id: 'paid',
        title: 'Paid',
        description: 'The order has been fully paid and settled.',
        bgClass: 'bg-emerald-600 dark:bg-emerald-500',
        hoverClass: 'hover:bg-emerald-700 dark:hover:bg-emerald-600',
        ringClass: 'focus-visible:outline-emerald-400 dark:focus-visible:outline-emerald-400',
        borderClass: 'border-emerald-700/30 dark:border-emerald-600/30',
        focusBgClass: 'data-[focus]:bg-emerald-600 dark:data-[focus]:bg-emerald-500',
        iconClass: 'text-emerald-600 dark:text-emerald-400'
    },
];

export default function PurchasesPage() {
    const [view, setView] = useState<ViewMode>("list");
    const [activeTab, setActiveTab] = useState<TabMode>("purchases");
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
            await loadData();
            setView("list");
            setActiveTab("returns");
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

    const handleUpdateReturnPaymentStatus = async (id: string, payment_status: 'unpaid' | 'paid') => {
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

    const handleUpdatePaymentStatus = async (id: string, payment_status: 'unpaid' | 'paid' | 'partial') => {
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
        unpaid: purchases.filter(p => p.payment_status === 'unpaid').length,
    };

    // ─── Views ──────────────────────────────────────────────────────────

    if (view === "new") {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">New Purchase Order</h1>
                <NewPurchaseForm
                    suppliers={suppliers}
                    products={products}
                    onSubmit={async (data) => {
                        await purchaseApi.create(data);
                        await loadData();
                        setView("list");
                    }}
                    onCancel={() => setView("list")}
                />
                <ConfirmDialog />
            </div>
        );
    }

    if (view === "detail" && selectedPurchase) {
        const p = selectedPurchase;
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{p.purchase_number}</h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Supplier: <span className="font-medium text-slate-700 dark:text-slate-300">{p.supplier?.name || "—"}</span>
                            {p.purchased_at && <> · Ordered: <span className="font-medium">{new Date(p.purchased_at).toLocaleDateString()}</span></>}
                            {p.received_at && <> · Received: <span className="text-green-600 font-medium">{new Date(p.received_at).toLocaleDateString()}</span></>}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                            <ChevronLeft className="h-4 w-4" /> Back to Purchases
                        </button>
                        {/* <div className="flex gap-2 mt-1">
                            <StatusBadge status={p.status} />
                            <PaymentStatusBadge status={p.payment_status} />
                        </div> */}
                    </div>
                </div>

                {/* Progress Tracking Bar */}
                {p.status !== 'cancelled' && (
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-6 shadow-sm ring-1 ring-slate-200 dark:ring-white/10 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div aria-hidden="true">
                            <div className="overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                <div
                                    style={{
                                        width: `${p.payment_status === 'paid' ? 100
                                            : p.status === 'received' ? 37.5
                                                : 12.5
                                            }%`
                                    }}
                                    className="h-2 rounded-full bg-emerald-600 transition-all duration-1000 ease-out"
                                />
                            </div>
                            <div className="mt-6 hidden grid-cols-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:grid">
                                <div className="text-emerald-600 dark:text-emerald-400">Order Placed</div>
                                <div className={(p.status === 'received' || p.payment_status === 'paid') ? 'text-emerald-600 dark:text-emerald-400 text-center' : 'text-center'}>
                                    Received
                                </div>
                                <div className={p.payment_status === 'paid' ? 'text-emerald-600 dark:text-emerald-400 text-center' : 'text-center'}>
                                    Paid
                                </div>
                                <div className={p.payment_status === 'paid' ? 'text-emerald-600 dark:text-emerald-400 text-right' : 'text-right'}>
                                    Completed
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {p.status === 'pending' ? (
                    <div className="bg-white shadow-sm sm:rounded-lg dark:bg-slate-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10 overflow-hidden ring-1 ring-slate-200 dark:ring-white/10">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="sm:flex sm:items-start sm:justify-between">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">Mark as Received</h3>
                                    <div className="mt-2 max-w-xl text-sm text-slate-500 dark:text-gray-400">
                                        <p>Confirm that the items in this purchase order have been delivered to your facility. This will automatically update your inventory stock levels and create the corresponding product batches.</p>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex sm:shrink-0 sm:items-center">
                                    <button
                                        type="button"
                                        onClick={() => handleMarkReceived(p.id)}
                                        disabled={saving}
                                        className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:focus-visible:outline-emerald-500 disabled:opacity-50 transition-all font-sans"
                                    >
                                        Receive Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : p.status === 'received' ? (
                    <div className="bg-white shadow-sm sm:rounded-lg dark:bg-slate-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10 overflow-hidden ring-1 ring-slate-200 dark:ring-white/10">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="sm:flex sm:items-start sm:justify-between">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                                        {p.payment_status === 'paid' ? "Order Fully Processed" : "Order Received - Pending Payment"}
                                    </h3>
                                    <div className="mt-2 max-w-xl text-sm text-slate-500 dark:text-gray-400">
                                        <p>
                                            {p.payment_status === 'paid'
                                                ? "This order has been received and fully paid. Stock has been added to your inventory."
                                                : `This order has been received, but the payment status is currently "${p.payment_status}". Please confirm the payment once settled.`}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex sm:shrink-0 sm:items-center">
                                    {p.payment_status !== 'paid' ? (
                                        <button
                                            type="button"
                                            onClick={() => handleUpdatePaymentStatus(p.id, 'paid')}
                                            disabled={updatingPayment}
                                            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:focus-visible:outline-emerald-500 disabled:opacity-50 transition-all font-sans"
                                        >
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Mark as Paid
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedPurchase(p);
                                                setView("return");
                                            }}
                                            className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-red-500 dark:hover:bg-red-400 dark:focus-visible:outline-red-500 transition-all font-sans"
                                        >
                                            <Undo2 className="h-4 w-4 mr-2" />
                                            Return Items
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : p.status === 'cancelled' ? (
                    <div className="bg-white shadow-sm sm:rounded-lg dark:bg-slate-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10 overflow-hidden ring-1 ring-slate-200 dark:ring-white/10">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <XCircle className="h-5 w-5 text-red-500" />
                                Purchase Order Cancelled
                            </h3>
                            <div className="mt-2 max-w-xl text-sm text-slate-500 dark:text-gray-400">
                                <p>This purchase order has been marked as cancelled. No stock was added to the inventory from this order.</p>
                            </div>
                        </div>
                    </div>
                ) : null}

                <Card>
                    <CardHeader><CardTitle className="text-base">Order Items ({p.items?.length || 0})</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto border-b border-slate-200 dark:border-slate-700">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Product</th>
                                        <th className="px-4 py-3">Batch</th>
                                        <th className="px-4 py-3">Expiry</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                        <th className="px-4 py-3 text-right">Unit Price (MMK)</th>
                                        <th className="px-4 py-3 text-right">Line Total (MMK)</th>
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
                                            <td className="px-4 py-3 text-right">{formatNumber(Number(item.purchase_price))}</td>
                                            <td className="px-4 py-3 text-right font-medium">{formatNumber(Number(item.total))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <dl className="space-y-4 px-2 pt-4 mt-4 ml-auto max-w-sm">
                            <div className="flex items-center justify-between">
                                <dt className="text-sm text-slate-500">Subtotal</dt>
                                <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">{formatNumber(Number(p.subtotal))}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-sm text-slate-500">Discount</dt>
                                <dd className="text-sm font-medium text-red-500">-{formatNumber(Number(p.discount))}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-sm text-slate-500">Tax</dt>
                                <dd className="text-sm font-medium text-amber-500">+{formatNumber(Number(p.tax))}</dd>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4">
                                <dt className="text-base font-semibold text-slate-900 dark:text-slate-100">Total (MMK)</dt>
                                <dd className="text-base font-bold text-slate-900 dark:text-white">{formatNumber(Number(p.total))}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {p.notes && (
                    <Card>
                        <CardContent className="pt-4">
                            <p className="text-sm text-slate-500"><span className="font-medium text-slate-700 dark:text-slate-300">Notes:</span> {p.notes}</p>
                        </CardContent>
                    </Card>
                )}
                <ConfirmDialog />
            </div>
        );
    }

    if (view === "return" && selectedPurchase) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Return Items</h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Supplier: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedPurchase.supplier?.name || "—"}</span>
                        </p>
                    </div>
                    <button onClick={() => setView("detail")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                        <ChevronLeft className="h-4 w-4" /> Back to Detail
                    </button>
                </div>
                <PurchaseReturnForm
                    purchase={selectedPurchase}
                    onSubmit={handleCreateReturn}
                    onCancel={() => setView("detail")}
                />
                <ConfirmDialog />
            </div>
        );
    }

    // ─── List view ────────────────────────────────────────────────────

    const tabs = [
        { id: "purchases", name: "Purchases", icon: ShoppingCart },
        { id: "returns", name: "Returns", icon: Undo2 },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Purchases</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage purchase orders and supplier deliveries.</p>
                </div>

                {activeTab === "purchases" && (
                    <div className="flex gap-2">
                        <AddButton
                            title="New Purchase Order"
                            icon={<Plus className="h-4 w-4" />}
                            onClick={() => setView("new")}
                        />
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabMode)}
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





            {/* Tab Views */}
            <div className="mt-2">
                {activeTab === "purchases" && (
                    <>
                        {/* Stats cards */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                            <IconCard
                                name="Total Orders"
                                stat={stats.total}
                                icon={ShoppingCart}
                                iconBgClassName="bg-blue-800"
                            />
                            <IconCard
                                name="Pending"
                                stat={stats.pending}
                                icon={Clock}
                                iconBgClassName="bg-amber-800"
                            />
                            <IconCard
                                name="Received"
                                stat={stats.received}
                                icon={Package}
                                iconBgClassName="bg-green-800"
                            />
                            <IconCard
                                name="Unpaid"
                                stat={stats.unpaid}
                                icon={CreditCard}
                                iconBgClassName="bg-orange-800"
                            />
                            <IconCard
                                name="Pending Returns"
                                stat={stats.pendingReturns}
                                icon={Undo2}
                                iconBgClassName="bg-red-800"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 flex-wrap my-6">
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
                                <option value="unpaid">Unpaid</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                            </select>
                            <Button variant="outline" onClick={loadData} title="Refresh">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>

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
                                                            <div className="flex justify-start gap-1">
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
                    </>
                )}

                {activeTab === "returns" && (
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
                                                        <div className="flex justify-end gap-1">
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
                )}
            </div>

            {/* Return Detail Modal */}
            {selectedReturn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedReturn(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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

                            {selectedReturn.items && selectedReturn.items.length > 0 && (
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Return Items ({selectedReturn.items.length})</p>
                                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                                                <tr>
                                                    <th className="px-3 py-2">Product</th>
                                                    <th className="px-3 py-2 text-right">Qty</th>
                                                    <th className="px-3 py-2 text-right">Price (MMK)</th>
                                                    <th className="px-3 py-2 text-right">Total (MMK)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {selectedReturn.items.map((item, i) => (
                                                    <tr key={i}>
                                                        <td className="px-3 py-2.5 font-medium">{item.product?.name || "—"}</td>
                                                        <td className="px-3 py-2.5 text-right">{item.quantity}</td>
                                                        <td className="px-3 py-2.5 text-right">{formatNumber(Number(item.price))}</td>
                                                        <td className="px-3 py-2.5 text-right font-semibold">{formatNumber(Number(item.total))}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="text-right mt-2">
                                        <span className="text-xl font-bold text-slate-900 dark:text-white">Total (MMK): {formatNumber(Number(selectedReturn.total))}</span>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Payment Status</p>
                                {selectedReturn.payment_status === 'paid' ? (
                                    <div className="flex items-center gap-2">
                                        <PaymentStatusBadge status="paid" />
                                        <span className="text-xs text-green-600 font-medium">Locked — cannot revert to unpaid</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <PaymentStatusBadge status={selectedReturn.payment_status} />
                                        <Button
                                            size="sm"
                                            disabled={updatingReturnPayment}
                                            onClick={() => handleUpdateReturnPaymentStatus(selectedReturn.id, 'paid')}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                            Mark Paid
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog />
        </div>
    );
}
