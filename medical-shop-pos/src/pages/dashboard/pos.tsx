import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiSale, CreateSalePayload, saleApi, customerApi, ApiCustomer } from "@/lib/sales";
import { ApiProduct, productApi } from "@/lib/inventory";
import { registerApi, shiftSessionApi, ApiCashRegister, ApiShiftSession } from "@/lib/registers";
import { storageLib } from "@/lib/storage";
import {
    Search, CheckCircle2, FileText, Plus, Minus,
    StickyNote, X, ShoppingCart, UserCheck, Store, LogOut
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useToast } from "@/components/ui/ToastProvider";

// ─── Types ─────────────────────────────────────────────────────────────────

interface CartItem {
    product_id: string;
    batch_id: string | null;
    name: string;
    quantity: number;
    unit_price: number;
    discount: number;
    tax: number;
    total: number;
    stock: number;
}

// ─── POS Page ─────────────────────────────────────────────────────────────────

export default function POSPage() {
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [customers, setCustomers] = useState<ApiCustomer[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [amountPaid, setAmountPaid] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer" | "wallet">("cash");
    const [notes, setNotes] = useState("");
    const [showNotes, setShowNotes] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [lastSale, setLastSale] = useState<ApiSale | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    const toast = useToast();

    // Shift Session States
    const [activeSession, setActiveSession] = useState<ApiShiftSession | null>(null);
    const [registers, setRegisters] = useState<ApiCashRegister[]>([]);
    const [openingCash, setOpeningCash] = useState<string>("");
    const [shiftNotes, setShiftNotes] = useState("");
    const [startingShift, setStartingShift] = useState(false);
    const [closingShift, setClosingShift] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [selectedRegisterId, setSelectedRegisterId] = useState("");
    const [closingCash, setClosingCash] = useState("");

    const loadData = () => {
        setLoading(true);
        const currentUser = storageLib.getAuthUser();

        Promise.all([
            productApi.list(),
            customerApi.list(),
            shiftSessionApi.list({ status: "open", user_id: currentUser?.id }),
            registerApi.list({ is_active: true })
        ])
            .then(([prods, custs, sessionsData, regs]) => {
                setProducts(prods);
                setCustomers(custs.data || []);
                // Find if the current user has an open session
                if (sessionsData.data && sessionsData.data.length > 0) {
                    setActiveSession(sessionsData.data[0]);
                } else {
                    setActiveSession(null);
                }
                setRegisters(regs);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenShift = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRegisterId) return;
        setStartingShift(true);
        try {
            const session = await shiftSessionApi.open({
                register_id: selectedRegisterId,
                opening_cash: parseFloat(openingCash) || 0,
                notes: shiftNotes
            });
            setActiveSession(session);
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to start shift.");
        } finally {
            setStartingShift(false);
        }
    };

    const handleCloseShift = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSession) return;
        setClosingShift(true);
        try {
            await shiftSessionApi.close(activeSession.id, {
                closing_cash: parseFloat(closingCash) || 0,
                notes: shiftNotes
            });
            setShowCloseModal(false);
            setClosingCash("");
            setShiftNotes("");
            loadData(); // Will set activeSession to null
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to close shift.");
        } finally {
            setClosingShift(false);
        }
    };

    const handlePrint = useReactToPrint({ contentRef: receiptRef });

    // ─── Helpers ───────────────────────────────────────────────────────

    const getStock = (product: ApiProduct) => {
        // Use active_batches stock if available, fallback to totalStock or quantity (depending on API response)
        return (product as any).total_stock ?? 0;
    };

    const filteredProducts = products.filter(p => {
        const s = search.toLowerCase();
        return (
            p.name.toLowerCase().includes(s) ||
            (p.generic_name || "").toLowerCase().includes(s) ||
            (p.barcode || "").toLowerCase().includes(s) ||
            (p.sku || "").toLowerCase().includes(s)
        );
    });

    // ─── Cart Operations ────────────────────────────────────────────────

    const addToCart = (product: ApiProduct) => {
        const stock = getStock(product);

        if (stock <= 0) {
            toast.error("This product is out of stock and cannot be sold.");
            return;
        }
        const existing = cart.findIndex(i => i.product_id === product.id);
        if (existing >= 0) {
            if (cart[existing].quantity >= stock) return;
            const updated = [...cart];
            updated[existing].quantity += 1;
            updated[existing].total = updated[existing].quantity * updated[existing].unit_price - updated[existing].discount;
            setCart(updated);
        } else {
            const price = Number(product.selling_price || product.mrp || 0);
            setCart(c => [...c, {
                product_id: product.id,
                batch_id: null,
                name: product.name,
                quantity: 1,
                unit_price: price,
                discount: 0,
                tax: Number(product.tax_rate || 0),
                total: price,
                stock,
            }]);
        }
    };

    const changeQty = (idx: number, delta: number) => {
        setCart(c => {
            const updated = [...c];
            const newQty = updated[idx].quantity + delta;
            if (newQty <= 0) { updated.splice(idx, 1); return updated; }
            if (newQty > updated[idx].stock) return c;
            updated[idx].quantity = newQty;
            updated[idx].total = newQty * updated[idx].unit_price - updated[idx].discount;
            return updated;
        });
    };

    const removeItem = (idx: number) => setCart(c => c.filter((_, i) => i !== idx));

    const setItemDiscount = (idx: number, val: string) => {
        setCart(c => {
            const updated = [...c];
            const disc = Math.max(0, parseFloat(val) || 0);
            updated[idx].discount = disc;
            updated[idx].total = Math.max(0, updated[idx].quantity * updated[idx].unit_price - disc);
            return updated;
        });
    };

    // ─── Totals ────────────────────────────────────────────────────────

    const subtotal = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const totalDiscount = cart.reduce((s, i) => s + i.discount, 0);
    const totalTax = cart.reduce((s, i) => s + (i.quantity * i.unit_price - i.discount) * (i.tax / 100), 0);
    const grandTotal = subtotal - totalDiscount + totalTax;
    const paid = parseFloat(amountPaid) || 0;
    const change = Math.max(0, paid - grandTotal);

    // ─── Checkout ─────────────────────────────────────────────────────

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (paid < grandTotal) { alert("Amount paid is less than the total!"); return; }
        setSubmitting(true);
        try {
            const payload: CreateSalePayload = {
                customer_id: selectedCustomerId || null,
                session_id: activeSession?.id || null,
                register_id: activeSession?.register_id || null,
                subtotal: parseFloat(subtotal.toFixed(2)),
                discount: parseFloat(totalDiscount.toFixed(2)),
                tax: parseFloat(totalTax.toFixed(2)),
                total: parseFloat(grandTotal.toFixed(2)),
                amount_paid: paid,
                change_amount: parseFloat(change.toFixed(2)),
                notes: notes || null,
                sold_at: new Date().toISOString(),
                items: cart.map(i => ({
                    product_id: i.product_id,
                    batch_id: i.batch_id,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    discount: i.discount,
                    tax: i.tax,
                    total: parseFloat(i.total.toFixed(2)),
                })),
                payments: [{
                    method: paymentMethod,
                    amount: paid,
                }],
            };
            const sale = await saleApi.create(payload);
            setLastSale(sale);
            setCart([]);
            setAmountPaid("");
            setSelectedCustomerId("");
            setNotes("");
            // Refresh product stock
            const updated = await productApi.list();
            setProducts(updated);
        } catch (e: any) {
            alert(e?.response?.data?.message || "Checkout failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Success Screen ────────────────────────────────────────────────

    if (lastSale) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-500">
                <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center h-16 w-16 shadow dark:bg-emerald-900/30 dark:border-emerald-800">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sale Complete!</h2>
                    <p className="text-slate-500 mt-1">Invoice: <span className="font-mono font-medium">{lastSale.invoice_number}</span></p>
                    <p className="text-slate-500">Total: <span className="font-bold text-emerald-600">{formatCurrency(Number(lastSale.total))}</span></p>
                    {Number(lastSale.change_amount) > 0 && <p className="text-slate-500">Change: <span className="font-bold">{formatCurrency(Number(lastSale.change_amount))}</span></p>}
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => handlePrint()}>
                        <FileText className="h-4 w-4 mr-2" /> Print Receipt
                    </Button>
                    <Button onClick={() => setLastSale(null)}>
                        <Plus className="h-4 w-4 mr-2" /> New Sale
                    </Button>
                </div>

                {/* Hidden print receipt */}
                <div className="hidden">
                    <div ref={receiptRef} className="p-6 w-[300px] text-black bg-white font-mono text-xs">
                        <h1 className="text-lg font-bold text-center border-b pb-2 mb-2">Medical POS</h1>
                        <p className="text-center mb-1">{new Date(lastSale.sold_at).toLocaleString()}</p>
                        <p className="mb-1">Invoice: {lastSale.invoice_number}</p>
                        {lastSale.customer && <p className="mb-3">Customer: {lastSale.customer.name}</p>}
                        <div className="border-t border-b py-2 my-2 space-y-1">
                            {lastSale.items?.map((item, i) => (
                                <div key={i} className="flex justify-between">
                                    <span>{item.quantity}x {item.product?.name}</span>
                                    <span>{formatCurrency(Number(item.total))}</span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-1 mt-2">
                            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(Number(lastSale.subtotal))}</span></div>
                            {Number(lastSale.discount) > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(Number(lastSale.discount))}</span></div>}
                            {Number(lastSale.tax) > 0 && <div className="flex justify-between"><span>Tax</span><span>+{formatCurrency(Number(lastSale.tax))}</span></div>}
                            <div className="flex justify-between font-bold text-sm border-t pt-1"><span>TOTAL</span><span>{formatCurrency(Number(lastSale.total))}</span></div>
                            <div className="flex justify-between"><span>Paid</span><span>{formatCurrency(Number(lastSale.amount_paid))}</span></div>
                            {Number(lastSale.change_amount) > 0 && <div className="flex justify-between"><span>Change</span><span>{formatCurrency(Number(lastSale.change_amount))}</span></div>}
                        </div>
                        <p className="text-center mt-4">Thank you for visiting!</p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Shift Session Modal ───────────────────────────────────────────

    if (!loading && !activeSession) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-12 animate-in fade-in duration-500">
                <Card className="w-full max-w-md shadow-lg border-blue-100 dark:border-blue-900/30">
                    <CardHeader className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/30">
                        <CardTitle className="text-xl flex items-center gap-2 text-blue-800 dark:text-blue-300">
                            <Store className="h-5 w-5" /> Start Shift Session
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleOpenShift} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Cash Register *</label>
                                <select
                                    className="mt-1 w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedRegisterId}
                                    onChange={e => setSelectedRegisterId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose Register --</option>
                                    {registers.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                                {registers.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        No active registers available. Please create one in Settings.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Opening Cash Amount</label>
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-2.5 text-slate-500 text-sm">{getCurrencySymbol()}</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="pl-7"
                                        min="0"
                                        step="0.01"
                                        value={openingCash}
                                        onChange={e => setOpeningCash(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes (Optional)</label>
                                <textarea
                                    className="mt-1 w-full text-sm rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 flex min-h-[80px] bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Starting shift notes..."
                                    value={shiftNotes}
                                    onChange={e => setShiftNotes(e.target.value)}
                                />
                            </div>

                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={startingShift || !selectedRegisterId}>
                                {startingShift ? "Starting Shift..." : "Open Shift & Start Selling"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ─── POS UI ────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col xl:flex-row gap-4 h-full animate-in fade-in duration-400" style={{ minHeight: "calc(100vh - 8rem)" }}>

            {showCloseModal && activeSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md shadow-lg">
                        <CardHeader className="border-b dark:border-slate-800">
                            <CardTitle className="text-xl">End Shift Session</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleCloseShift} className="space-y-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Opening Cash:</span>
                                        <span className="font-semibold">{formatCurrency(Number(activeSession.opening_cash))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Total Sales:</span>
                                        <span className="font-semibold text-emerald-600">{formatCurrency(Number(activeSession.total_sales))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Total Refunds:</span>
                                        <span className="font-semibold text-red-500">{formatCurrency(Number(activeSession.total_refunds))}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 mt-2 dark:border-slate-800 font-bold">
                                        <span>Expected Drawer:</span>
                                        <span>{formatCurrency(Number(activeSession.opening_cash) + Number(activeSession.total_sales) - Number(activeSession.total_refunds))}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Actual Closing Cash</label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-3 top-2.5 text-slate-500 text-sm">{getCurrencySymbol()}</span>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            className="pl-7"
                                            min="0"
                                            step="0.01"
                                            value={closingCash}
                                            onChange={e => setClosingCash(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes (Optional)</label>
                                    <textarea
                                        className="mt-1 w-full text-sm rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 flex min-h-[80px] bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Closing shift notes..."
                                        value={shiftNotes}
                                        onChange={e => setShiftNotes(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={closingShift}>
                                        {closingShift ? "Closing..." : "Close Shift"}
                                    </Button>
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCloseModal(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* LEFT: product grid */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Point of Sale</h1>
                        {activeSession && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                <Store className="h-3.5 w-3.5" />
                                {activeSession.register?.name || "Unknown Register"}
                            </span>
                        )}
                    </div>
                    {activeSession && (
                        <Button variant="outline" size="sm" onClick={() => setShowCloseModal(true)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/50">
                            <LogOut className="h-4 w-4 mr-2" /> End Shift
                        </Button>
                    )}
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="pb-3 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Scan barcode or search medicine / SKU…"
                                className="pl-9"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0">
                        {loading ? (
                            <p className="py-16 text-center text-slate-400">Loading products…</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                                {filteredProducts.map(p => {
                                    const stock = getStock(p);
                                    const isOutOfStock = stock <= 0;
                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => addToCart(p)}
                                            className={`border rounded-xl p-3 cursor-pointer transition-all duration-150 flex flex-col justify-between h-28 select-none ${isOutOfStock
                                                    ? "opacity-50 grayscale border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed"
                                                    : "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:border-blue-500/50 active:scale-95 bg-white dark:bg-slate-900 dark:border-slate-800"
                                                }`}
                                        >
                                            <div>
                                                <p className="font-semibold text-sm line-clamp-2 leading-tight">{p.name}</p>
                                                <p className="text-xs text-slate-400 mt-0.5 truncate">{p.generic_name || p.sku}</p>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(Number(p.selling_price || p.mrp))}</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded border ${isOutOfStock
                                                        ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:border-slate-700"
                                                    }`}>
                                                    {isOutOfStock ? "Out of Stock" : stock}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredProducts.length === 0 && (
                                    <div className="col-span-full py-12 text-center text-slate-400">
                                        {search ? "No products matching your search." : "No products with available stock."}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT: cart & payment */}
            <div className="w-full xl:w-96 flex flex-col gap-4 shrink-0">
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-slate-50 border-b dark:bg-slate-900/50 dark:border-slate-800 shrink-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Cart {cart.length > 0 && <span className="text-xs font-normal bg-blue-600 text-white rounded-full px-2 py-0.5">{cart.length}</span>}
                            </CardTitle>
                            {cart.length > 0 && (
                                <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">Clear all</button>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-slate-300 dark:text-slate-600">
                                <ShoppingCart className="h-8 w-8 mb-2" />
                                <p className="text-sm">Cart is empty</p>
                                <p className="text-xs">Click a product to add it</p>
                            </div>
                        ) : cart.map((item, idx) => (
                            <div key={idx} className="rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 bg-white dark:bg-slate-900/50">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium leading-tight flex-1">{item.name}</p>
                                    <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500 shrink-0">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mt-2 gap-2">
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => changeQty(idx, -1)} className="h-6 w-6 rounded border flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800">
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                        <button onClick={() => changeQty(idx, 1)} className="h-6 w-6 rounded border flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800">
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <span className="absolute left-1.5 top-1 text-xs text-slate-400">-</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.discount || ""}
                                                onChange={e => setItemDiscount(idx, e.target.value)}
                                                placeholder="Disc"
                                                className="w-16 h-7 pl-4 pr-1 text-xs border rounded dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(item.total)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>

                    {/* Payment section */}
                    <div className="border-t dark:border-slate-800 p-4 space-y-3 shrink-0 bg-slate-50 dark:bg-slate-900/50">
                        {/* Customer selection */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <UserCheck className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                <select
                                    value={selectedCustomerId}
                                    onChange={e => setSelectedCustomerId(e.target.value)}
                                    className="w-full h-9 pl-8 pr-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Walk-in Customer</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => setShowNotes(!showNotes)}
                                className={`h-9 w-9 rounded-md border flex items-center justify-center transition-colors ${showNotes ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                                title="Add notes"
                            >
                                <StickyNote className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {showNotes && (
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                                placeholder="Sale notes…"
                                className="w-full text-sm rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 resize-none"
                            />
                        )}

                        {/* Totals */}
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                            </div>
                            {totalDiscount > 0 && (
                                <div className="flex justify-between text-red-500">
                                    <span>Discount</span><span>-{formatCurrency(totalDiscount)}</span>
                                </div>
                            )}
                            {totalTax > 0 && (
                                <div className="flex justify-between text-amber-600">
                                    <span>Tax</span><span>+{formatCurrency(totalTax)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white border-t pt-2 dark:border-slate-700">
                                <span>TOTAL</span><span>{formatCurrency(grandTotal)}</span>
                            </div>
                        </div>

                        {/* Payment method */}
                        <div className="grid grid-cols-4 gap-1">
                            {(["cash", "card", "bank_transfer", "wallet"] as const).map(method => (
                                <button
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    className={`px-2 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${paymentMethod === method ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400"}`}
                                >
                                    {method.replace("_", " ")}
                                </button>
                            ))}
                        </div>

                        {/* Amount paid */}
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Input
                                    type="number"
                                    placeholder="Amount Paid"
                                    value={amountPaid}
                                    onChange={e => setAmountPaid(e.target.value)}
                                    className="pr-16"
                                    min="0"
                                    step="0.01"
                                />
                                {paid > 0 && (
                                    <span className={`absolute right-2 top-2 text-xs font-medium ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                        {change >= 0 ? `+${formatCurrency(change)}` : formatCurrency(paid - grandTotal)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || submitting || paid < grandTotal}
                            className="w-full h-11 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {submitting ? "Processing…" : `Checkout — ${formatCurrency(grandTotal)}`}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
