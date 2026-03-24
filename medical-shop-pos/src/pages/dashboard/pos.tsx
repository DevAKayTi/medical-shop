import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiSale, CreateSalePayload, saleApi, customerApi, ApiCustomer } from "@/lib/sales";
import { ApiProduct, productApi, ApiCategory, categoryApi } from "@/lib/inventory";
import { registerApi, shiftSessionApi, ApiCashRegister, ApiShiftSession } from "@/lib/registers";
import { storageLib } from "@/lib/storage";
import {
    Search, CheckCircle2, FileText, Plus, Minus,
    StickyNote, X, ShoppingCart, UserCheck, Store, LogOut
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useToast } from "@/components/ui/ToastProvider";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { ComboboxMenu } from "@/components/ui/ComboboxMenu";

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
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
    const [customers, setCustomers] = useState<ApiCustomer[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [amountPaid, setAmountPaid] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer" | "wallet">("cash");
    const [notes, setNotes] = useState("");
    const [showNotes, setShowNotes] = useState(false);
    const [activeTab, setActiveTab] = useState<"products" | "cart">("products");

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
            categoryApi.list(),
            customerApi.list(),
            shiftSessionApi.list({ status: "open", user_id: currentUser?.id }),
            registerApi.list({ is_active: true })
        ])
            .then(([prods, cats, custs, sessionsData, regs]) => {
                setProducts(prods);
                setCategories(cats);
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
            toast.error(err.response?.data?.message || "Failed to start shift.");
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
            toast.error(err.response?.data?.message || "Failed to close shift.");
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
        if (selectedCategoryId !== "all" && p.category_id !== selectedCategoryId) return false;

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
            const item = { ...updated[existing] };
            item.quantity += 1;
            item.total = item.quantity * item.unit_price - item.discount;
            updated[existing] = item;
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
            const item = { ...updated[idx] };
            const newQty = item.quantity + delta;

            if (newQty <= 0) {
                updated.splice(idx, 1);
                return updated;
            }
            if (newQty > item.stock) return c;

            item.quantity = newQty;
            item.total = item.quantity * item.unit_price - item.discount;
            updated[idx] = item;

            return updated;
        });
    };

    const removeItem = (idx: number) => setCart(c => c.filter((_, i) => i !== idx));

    const setItemQty = (idx: number, val: string) => {
        setCart(c => {
            const updated = [...c];
            const item = { ...updated[idx] };

            let newQty = val === "" ? 0 : parseInt(val);
            if (isNaN(newQty) || newQty < 0) newQty = 0;
            if (newQty > item.stock) newQty = item.stock;

            item.quantity = newQty;
            item.total = Math.max(0, item.quantity * item.unit_price - item.discount);
            updated[idx] = item;

            return updated;
        });
    };

    const setItemDiscount = (idx: number, val: string) => {
        setCart(c => {
            const updated = [...c];
            const item = { ...updated[idx] };
            const disc = Math.max(0, parseFloat(val) || 0);

            item.discount = disc;
            item.total = Math.max(0, item.quantity * item.unit_price - disc);
            updated[idx] = item;

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
        if (paid < grandTotal) { toast.error("Amount paid is less than the total!"); return; }
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
            toast.error(e?.response?.data?.message || "Checkout failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Success Screen ────────────────────────────────────────────────

    if (lastSale) {
        return (
            <div className="relative isolate min-h-[calc(100vh-8rem)] flex items-center justify-center px-6 py-16 overflow-hidden animate-in fade-in duration-500">
                {/* Background blobs for glassmorphism effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-400/20 dark:bg-emerald-600/20 rounded-full blur-[100px] -z-10 pointer-events-none" />
                <div className="absolute top-1/2 right-1/4 -translate-y-1/3 w-[600px] h-[600px] bg-sky-400/20 dark:bg-sky-600/20 rounded-full blur-[100px] -z-10 pointer-events-none" />

                <svg
                    aria-hidden="true"
                    className="absolute inset-0 -z-20 size-full mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-slate-200 dark:stroke-slate-800"
                >
                    <defs>
                        <pattern
                            x="50%"
                            y={-64}
                            id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527"
                            width={200}
                            height={200}
                            patternUnits="userSpaceOnUse"
                        >
                            <path d="M100 200V.5M.5 .5H200" fill="none" />
                        </pattern>
                    </defs>
                    <svg x="50%" y={-64} className="overflow-visible fill-slate-50 dark:fill-slate-900/50">
                        <path
                            d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M299.5 800h201v201h-201Z"
                            strokeWidth={0}
                        />
                    </svg>
                    <rect fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)" width="100%" height="100%" strokeWidth={0} />
                </svg>
                <div className="flex flex-col items-center justify-center w-full max-w-sm min-h-[480px] p-10 space-y-8 animate-in fade-in zoom-in duration-500 bg-white dark:bg-black/30 backdrop-blur-[40px] backdrop-saturate-[180%] border border-white/50 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] rounded-[32px] mx-auto ring-1 ring-black/5 dark:ring-white/5">

                    <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center h-16 w-16 shadow-sm dark:bg-emerald-900/50 dark:border-emerald-700/50">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sale Complete!</h2>
                        <p className="text-slate-500 mt-1 text-sm">Invoice: <span className="font-mono font-medium">{lastSale.invoice_number}</span></p>
                        <p className="text-slate-500 text-sm">{new Date(lastSale.sold_at).toLocaleString()}</p>
                    </div>

                    <div className="w-full">
                        <div className="border-t border-slate-300/50 dark:border-slate-700/50 pt-3 mt-3 space-y-1">

                            <div className="flex justify-between font-bold text-base text-slate-900 dark:text-white pt-2">
                                <span>TOTAL</span>
                                <span>{formatCurrency(Number(lastSale.total))}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-400 mt-2"><span>Paid</span><span>{formatCurrency(Number(lastSale.amount_paid))}</span></div>
                            {Number(lastSale.change_amount) > 0 && <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium"><span>Change</span><span>{formatCurrency(Number(lastSale.change_amount))}</span></div>}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => handlePrint()}>
                            <FileText className="h-4 w-4 mr-2" /> Print Receipt
                        </Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/25" onClick={() => setLastSale(null)}>
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
            </div>
        );
    }

    // ─── Shift Session Modal ───────────────────────────────────────────

    if (!loading && !activeSession) {
        return (
            <div className="relative isolate min-h-[calc(100vh-8rem)] flex items-center justify-center px-6 py-16 overflow-hidden animate-in fade-in duration-500">
                <svg
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 size-full mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-gray-200"
                >
                    <defs>
                        <pattern
                            x="50%"
                            y={-64}
                            id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527"
                            width={200}
                            height={200}
                            patternUnits="userSpaceOnUse"
                        >
                            <path d="M100 200V.5M.5 .5H200" fill="none" />
                        </pattern>
                    </defs>
                    <svg x="50%" y={-64} className="overflow-visible fill-gray-50">
                        <path
                            d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M299.5 800h201v201h-201Z"
                            strokeWidth={0}
                        />
                    </svg>
                    <rect fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)" width="100%" height="100%" strokeWidth={0} />
                </svg>

                <div className="w-full max-w-lg">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/30">
                            <Store className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Start Shift Session</h1>
                        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">Select your register and enter opening cash to begin selling.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleOpenShift} className="space-y-5">
                        {/* Register select */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Cash Register <span className="text-red-500">*</span>
                            </label>
                            <SelectMenu
                                value={selectedRegisterId}
                                onChange={setSelectedRegisterId}
                                options={[
                                    { value: "", label: "— Select a Register —" },
                                    ...registers.map(r => ({ value: r.id, label: r.name })),
                                ]}
                            />
                            {registers.length === 0 && (
                                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    ⚠ No active registers available. Please create one in Settings.
                                </p>
                            )}
                        </div>

                        {/* Opening cash */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Opening Cash Amount <span className="text-sm">({getCurrencySymbol()})</span>
                            </label>
                            <div className="relative">

                                <input
                                    type="number"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    value={openingCash}
                                    onChange={e => setOpeningCash(e.target.value)}
                                    className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Notes <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Starting shift notes..."
                                value={shiftNotes}
                                onChange={e => setShiftNotes(e.target.value)}
                                className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                            />
                        </div>

                        {/* Submit */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={startingShift || !selectedRegisterId}
                                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
                            >
                                {startingShift ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Starting Shift...
                                    </span>
                                ) : "Open Shift & Start Selling"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (loading && !activeSession) {
        return (
            <div className="relative isolate min-h-[calc(100vh-8rem)] flex items-center justify-center px-6 py-16 overflow-hidden animate-in fade-in duration-500">
                <svg
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 size-full mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-gray-200"
                >
                    <defs>
                        <pattern
                            x="50%"
                            y={-64}
                            id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527"
                            width={200}
                            height={200}
                            patternUnits="userSpaceOnUse"
                        >
                            <path d="M100 200V.5M.5 .5H200" fill="none" />
                        </pattern>
                    </defs>
                    <svg x="50%" y={-64} className="overflow-visible fill-gray-50">
                        <path
                            d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M299.5 800h201v201h-201Z"
                            strokeWidth={0}
                        />
                    </svg>
                    <rect fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)" width="100%" height="100%" strokeWidth={0} />
                </svg>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading POS...</p>
                </div>
            </div>
        )
    }

    // ─── POS UI ────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col xl:flex-row gap-4 h-[calc(100vh-8rem)] animate-in fade-in duration-400 group/pos">

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
                                        <span className="font-semibold">{Number(activeSession.opening_cash).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Total Sales:</span>
                                        <span className="font-semibold text-emerald-600">{Number(activeSession.total_sales).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Total Refunds:</span>
                                        <span className="font-semibold text-red-500">{Number(activeSession.total_refunds).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 mt-2 dark:border-slate-800 font-bold">
                                        <span>Expected Drawer (MMK):</span>
                                        <span>{(Number(activeSession.opening_cash) + Number(activeSession.total_sales) - Number(activeSession.total_refunds)).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Actual Closing Cash <span className="text-sm">({getCurrencySymbol()})</span></label>
                                    <div className="relative mt-1">

                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            className="pl-3"
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
                                        className="mt-1 w-full text-sm rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 flex min-h-[80px] bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <div className={`flex-1 flex flex-col gap-4 min-h-0 min-w-0 ${activeTab === "cart" ? "hidden xl:flex" : "flex"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Point of Sale</h1>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {activeSession && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
                                <Store className="h-3.5 w-3.5" />
                                {activeSession.register?.name || "Unknown Register"}
                            </span>
                        )}
                    </div>
                    {activeSession && (
                        <Button variant="outline" size="sm" onClick={() => setShowCloseModal(true)} className="text-red-500 hover:text-red-600 hover:bg-red-500 hover:text-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/50">
                            <LogOut className="h-4 w-4 mr-2" /> End Shift
                        </Button>
                    )}
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="pb-3 shrink-0">
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Scan barcode or search medicine / SKU…"
                                className="pl-9"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Categories scrollable row */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 px-1 -mx-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
                            <button
                                onClick={() => setSelectedCategoryId("all")}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${selectedCategoryId === "all" ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600"}`}
                            >
                                All Products
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                    className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${selectedCategoryId === cat.id ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600"}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
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
                                                : "hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 dark:hover:border-emerald-500/50 active:scale-95 bg-white dark:bg-slate-900 dark:border-slate-800"
                                                }`}
                                        >
                                            <div>
                                                <p className="font-semibold text-sm line-clamp-2 leading-tight">{p.name}</p>
                                                <p className="text-xs text-slate-400 mt-0.5 truncate">{p.generic_name || p.sku}</p>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="font-bold text-slate-800 dark:text-slate-400">{formatCurrency(Number(p.selling_price || p.mrp))}</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded border font-bold ${isOutOfStock
                                                    ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                                                    : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-400 dark:border-emerald-700"
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
            <div className={`w-full xl:w-96 flex flex-col gap-4 shrink-0 xl:h-full ${activeTab === "products" ? "hidden xl:flex" : "flex"}`}>
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-slate-50 border-b dark:bg-slate-900/50 dark:border-slate-800 shrink-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Cart {cart.length > 0 && <span className="text-xs font-normal bg-emerald-600 text-white rounded-full px-2 py-0.5">{cart.length}</span>}
                            </CardTitle>
                            {cart.length > 0 && (
                                <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">Clear all</button>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
                        {cart.length === 0 ? (
                            <div className="w-full h-full flex flex-col items-center justify-center h-32 text-slate-300 dark:text-slate-600">
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
                                        <button onClick={() => changeQty(idx, -1)} className="h-6 w-6 rounded border flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-12 h-6 text-center text-sm font-bold border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 mx-1"
                                            value={item.quantity || ""}
                                            onChange={e => setItemQty(idx, e.target.value)}
                                            onBlur={() => { if (item.quantity <= 0) removeItem(idx); }}
                                        />
                                        <button onClick={() => changeQty(idx, 1)} className="h-6 w-6 rounded border flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
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
                                                className="w-16 h-7 pl-4 pr-1 text-xs border rounded dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{item.total.toLocaleString()}</span>
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
                                <div className="absolute left-2.5 top-[10px] z-10 pointer-events-none">
                                    <UserCheck className="h-4 w-4 text-slate-400" />
                                </div>
                                <ComboboxMenu
                                    value={selectedCustomerId}
                                    onChange={setSelectedCustomerId}
                                    options={[
                                        { value: "", label: "Walk-in Customer" },
                                        ...customers.map(c => ({
                                            value: c.id,
                                            label: `${c.name} ${c.phone ? `(${c.phone})` : ""}`
                                        }))
                                    ]}
                                    placeholder="Search customer..."
                                    className="h-9 py-0 pl-8 pr-8 text-sm leading-8"
                                />
                            </div>
                            <button
                                onClick={() => setShowNotes(!showNotes)}
                                className={`h-9 w-9 rounded-md border flex items-center justify-center transition-colors ${showNotes ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
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
                                className="w-full text-sm rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-900 resize-none"
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
                                    className={`px-2 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${paymentMethod === method ? "bg-emerald-600 text-white" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400"}`}
                                >
                                    {method === "bank_transfer" ? "bank" : method.replace("_", " ")}
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
                                        {change >= 0 ? `+${change.toLocaleString()}` : (paid - grandTotal).toLocaleString()}
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

            {/* Mobile Bottom Bar */}
            <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-950 border-t dark:border-slate-800 p-2 shadow-lg flex items-center justify-between gap-2 h-16 px-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-none">Total</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {formatCurrency(grandTotal)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab(activeTab === "products" ? "cart" : "products")}
                        className={`relative flex items-center gap-2 h-11 px-6 rounded-lg font-bold transition-all ${activeTab === "products"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 active:scale-95"
                            : "bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200"
                            }`}
                    >
                        {activeTab === "products" ? (
                            <>
                                <ShoppingCart className="h-4 w-4" />
                                <span>Go to Cart</span>
                                {cart.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center font-bold border-2 border-white dark:border-slate-950">
                                        {cart.length}
                                    </span>
                                )}
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" />
                                <span>Add Products</span>
                            </>
                        )}
                    </button>

                    {activeTab === "cart" && cart.length > 0 && paid >= grandTotal && (
                        <Button
                            onClick={handleCheckout}
                            disabled={submitting}
                            className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95"
                        >
                            {submitting ? "..." : "Checkout"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Safe area spacer for mobile bar */}
            <div className="xl:hidden h-16 shrink-0" />
        </div>
    );
}
