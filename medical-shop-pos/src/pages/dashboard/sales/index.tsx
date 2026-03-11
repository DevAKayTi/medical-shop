import { useState, useEffect } from "react";
import { saleApi, ApiSale } from "@/lib/sales";
import { storageLib } from "@/lib/storage";
import { formatCurrency } from "@/lib/currency";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Receipt,
    Search,
    Eye,
    Ban,
    ChevronLeft,
    ChevronRight,
    Calendar,
    User
} from "lucide-react";
import { Input } from "@/components/ui/Input";

export default function SalesHistoryPage() {
    const [sales, setSales] = useState<ApiSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchInvoice, setSearchInvoice] = useState("");

    // Selection for Details Modal
    const [selectedSale, setSelectedSale] = useState<ApiSale | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // Auth check for Voiding
    const userRole = storageLib.getAuthUser()?.role;
    const canVoid = userRole === "Admin" || userRole === "Manager";

    const loadSales = async () => {
        setLoading(true);
        try {
            const params: any = { page };
            if (statusFilter !== "all") params.status = statusFilter;
            // The backend might not support invoice search natively in index yet without tweaking, 
            // but we can pass it if we add it to the backend later. For now, we will rely on pagination.

            const res = await saleApi.list(params);

            // Client-side filter for invoice number if backend doesn't support it directly
            let data = res.data;
            if (searchInvoice.trim()) {
                const searchLower = searchInvoice.toLowerCase();
                data = data.filter(s => s.invoice_number.toLowerCase().includes(searchLower));
            }

            setSales(data);
            // If the API returns pagination metadata, we should use it. 
            // Our saleApi.list definition expects { data, total, per_page } but the actual backend 
            // paginate() returns { data, current_page, last_page, total }
            setLastPage((res as any).last_page || 1);

        } catch (err) {
            console.error("Failed to load sales:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSales();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, statusFilter]);

    // Re-filter when search changes locally if we only have the current page data
    useEffect(() => {
        const timer = setTimeout(() => {
            loadSales();
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInvoice]);

    const handleVoidSale = async (id: string) => {
        if (!window.confirm("Are you sure you want to void this sale? This action will return items to stock and adjust shift session totals.")) {
            return;
        }

        try {
            await saleApi.void(id);
            setSales(sales.map(s => s.id === id ? { ...s, status: "refunded" } : s));
            if (selectedSale?.id === id) {
                setSelectedSale({ ...selectedSale, status: "refunded" });
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to void sale.");
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50";
            case "returned":
                return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50";
            case "refunded":
            case "voided":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50";
            default:
                return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Sales History</h1>
                    <p className="text-slate-500 dark:text-slate-400">View past transactions, payment methods, and receipts.</p>
                </div>

                <div className="flex gap-2">
                    {/* Actions can go here in the future if needed */}
                </div>
            </div>

            <Card>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by Invoice #"
                            className="pl-9 bg-white dark:bg-slate-900"
                            value={searchInvoice}
                            onChange={(e) => setSearchInvoice(e.target.value)}
                        />
                    </div>

                    <div className="flex bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-1 w-fit mt-2 sm:mt-0 flex-wrap">
                        {["all", "completed", "returned", "refunded"].map(s => (
                            <button
                                key={s}
                                onClick={() => { setStatusFilter(s); setPage(1); }}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${statusFilter === s ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-3 font-medium">Invoice No.</th>
                                <th className="px-5 py-3 font-medium">Date & Time</th>
                                <th className="px-5 py-3 font-medium">Customer</th>
                                <th className="px-5 py-3 font-medium">Cashier</th>
                                <th className="px-5 py-3 font-medium text-right">Total</th>
                                <th className="px-5 py-3 font-medium text-center">Status</th>
                                <th className="px-5 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-blue-600"></div>
                                            Loading sales history...
                                        </div>
                                    </td>
                                </tr>
                            ) : sales.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Receipt className="h-10 w-10 text-slate-300 mb-3" />
                                            <p>No sales matching your filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sales.map(sale => (
                                    <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                                            {sale.invoice_number}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                            {formatDate(sale.sold_at || sale.created_at)}
                                        </td>
                                        <td className="px-5 py-4">
                                            {sale.customer ? (
                                                <span className="font-medium text-slate-900 dark:text-slate-100">{sale.customer.name}</span>
                                            ) : (
                                                <span className="text-slate-400 italic">Walk-in</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                            {sale.cashier?.name || "Unknown"}
                                        </td>
                                        <td className="px-5 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                                            {formatCurrency(Number(sale.total))}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize ${getStatusStyles(sale.status)}`}>
                                                {sale.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => { setSelectedSale(sale); setShowDetails(true); }}
                                                    className="h-8"
                                                >
                                                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                                                </Button>

                                                {canVoid && sale.status === 'completed' && !sale.invoice_number.startsWith('REF-') && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleVoidSale(sale.id)}
                                                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/50"
                                                    >
                                                        <Ban className="h-3.5 w-3.5 mr-1" /> Void
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {lastPage > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-4">
                        <p className="text-sm text-slate-500">
                            Page <span className="font-medium">{page}</span> of <span className="font-medium">{lastPage}</span>
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                                disabled={page === lastPage}
                            >
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* View Details Modal */}
            {showDetails && selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
                        <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-blue-500" />
                                    Invoice {selectedSale.invoice_number}
                                </CardTitle>
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-4">
                                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(selectedSale.sold_at || selectedSale.created_at)}</span>
                                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {selectedSale.cashier?.name}</span>
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowDetails(false)}>
                                <span className="sr-only">Close</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-5 w-5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </Button>
                        </CardHeader>

                        <CardContent className="overflow-y-auto p-6 space-y-6">
                            <div className="flex justify-between items-start bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Customer Details</h4>
                                    {selectedSale.customer ? (
                                        <>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{selectedSale.customer.name}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{selectedSale.customer.phone || 'No phone'}</p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">Walk-in Customer</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Status</h4>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize ${getStatusStyles(selectedSale.status)}`}>
                                        {selectedSale.status}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 border-b pb-2 dark:border-slate-800">Order Items</h3>
                                <table className="w-full text-sm">
                                    <thead className="text-slate-500 dark:text-slate-400 border-b dark:border-slate-800 text-left">
                                        <tr>
                                            <th className="font-medium py-2">Item</th>
                                            <th className="font-medium py-2 text-right">Qty</th>
                                            <th className="font-medium py-2 text-right">Price</th>
                                            <th className="font-medium py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {selectedSale.items?.map((item, i) => (
                                            <tr key={i}>
                                                <td className="py-2.5">
                                                    <p className="font-medium text-slate-900 dark:text-slate-100">{item.product?.name || "Unknown Product"}</p>
                                                    {item.batch && <p className="text-xs text-slate-500">Batch: {item.batch.batch_number}</p>}
                                                </td>
                                                <td className="py-2.5 text-right">{item.quantity}</td>
                                                <td className="py-2.5 text-right">{formatCurrency(Number(item.unit_price))}</td>
                                                <td className="py-2.5 text-right font-medium">{formatCurrency(Number(item.total))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t-2 dark:border-slate-800">
                                        <tr>
                                            <th colSpan={3} className="py-2 text-right text-slate-500 font-normal">Subtotal</th>
                                            <td className="py-2 text-right">{formatCurrency(Number(selectedSale.subtotal))}</td>
                                        </tr>
                                        {Number(selectedSale.discount) > 0 && (
                                            <tr>
                                                <th colSpan={3} className="py-1 text-right text-slate-500 font-normal">Discount</th>
                                                <td className="py-1 text-right text-red-500">-{formatCurrency(Number(selectedSale.discount))}</td>
                                            </tr>
                                        )}
                                        {Number(selectedSale.tax) > 0 && (
                                            <tr>
                                                <th colSpan={3} className="py-1 text-right text-slate-500 font-normal">Tax</th>
                                                <td className="py-1 text-right">{formatCurrency(Number(selectedSale.tax))}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <th colSpan={3} className="py-3 text-right font-bold text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wider">Total</th>
                                            <td className="py-3 text-right font-bold text-lg text-slate-900 dark:text-slate-100">{formatCurrency(Number(selectedSale.total))}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {selectedSale.payments && selectedSale.payments.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 border-b pb-2 dark:border-slate-800">Payments</h3>
                                    <ul className="space-y-2 text-sm">
                                        {selectedSale.payments.map((p, i) => (
                                            <li key={i} className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded border border-slate-100 dark:border-slate-800">
                                                <span className="capitalize font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                    {p.method}
                                                    {p.reference && <span className="text-xs text-slate-400 font-normal">(Ref: {p.reference})</span>}
                                                </span>
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(p.amount))}</span>
                                            </li>
                                        ))}
                                        <li className="flex justify-between pt-2 px-2.5">
                                            <span className="text-slate-500">Change Returned:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(Number(selectedSale.change_amount))}</span>
                                        </li>
                                    </ul>
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
