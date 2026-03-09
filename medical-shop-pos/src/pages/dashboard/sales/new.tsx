import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiSale, CreateSalePayload, saleApi, customerApi, ApiCustomer } from "@/lib/sales";
import { ApiProduct, productApi } from "@/lib/inventory";
import {
    Search, CheckCircle2, FileText, Plus, Minus,
    StickyNote, X, ShoppingCart, UserCheck
} from "lucide-react";
import { useReactToPrint } from "react-to-print";

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

    useEffect(() => {
        Promise.all([productApi.list(), customerApi.list()])
            .then(([prods, custs]) => {
                setProducts(prods);
                setCustomers(custs.data || []);
            })
            .finally(() => setLoading(false));
    }, []);

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
        ) && getStock(p) > 0;
    });

    // ─── Cart Operations ────────────────────────────────────────────────

    const addToCart = (product: ApiProduct) => {
        const stock = getStock(product);
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
                    <p className="text-slate-500">Total: <span className="font-bold text-emerald-600">{Number(lastSale.total).toFixed(2)}</span></p>
                    {Number(lastSale.change_amount) > 0 && <p className="text-slate-500">Change: <span className="font-bold">{Number(lastSale.change_amount).toFixed(2)}</span></p>}
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
                                    <span>{Number(item.total).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-1 mt-2">
                            <div className="flex justify-between"><span>Subtotal</span><span>{Number(lastSale.subtotal).toFixed(2)}</span></div>
                            {Number(lastSale.discount) > 0 && <div className="flex justify-between"><span>Discount</span><span>-{Number(lastSale.discount).toFixed(2)}</span></div>}
                            {Number(lastSale.tax) > 0 && <div className="flex justify-between"><span>Tax</span><span>+{Number(lastSale.tax).toFixed(2)}</span></div>}
                            <div className="flex justify-between font-bold text-sm border-t pt-1"><span>TOTAL</span><span>{Number(lastSale.total).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Paid</span><span>{Number(lastSale.amount_paid).toFixed(2)}</span></div>
                            {Number(lastSale.change_amount) > 0 && <div className="flex justify-between"><span>Change</span><span>{Number(lastSale.change_amount).toFixed(2)}</span></div>}
                        </div>
                        <p className="text-center mt-4">Thank you for visiting!</p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── POS UI ────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col xl:flex-row gap-4 h-full animate-in fade-in duration-400" style={{ minHeight: "calc(100vh - 8rem)" }}>

            {/* LEFT: product grid */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Point of Sale</h1>

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
                                {filteredProducts.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        className="border rounded-xl p-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:border-blue-500/50 active:scale-95 transition-all duration-150 bg-white dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between h-28 select-none"
                                    >
                                        <div>
                                            <p className="font-semibold text-sm line-clamp-2 leading-tight">{p.name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5 truncate">{p.generic_name || p.sku}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="font-bold text-blue-600 dark:text-blue-400">{Number(p.selling_price || p.mrp).toFixed(2)}</span>
                                            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 border dark:border-slate-700">
                                                {getStock(p)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
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
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{item.total.toFixed(2)}</span>
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
                                <span>Subtotal</span><span>{subtotal.toFixed(2)}</span>
                            </div>
                            {totalDiscount > 0 && (
                                <div className="flex justify-between text-red-500">
                                    <span>Discount</span><span>-{totalDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            {totalTax > 0 && (
                                <div className="flex justify-between text-amber-600">
                                    <span>Tax</span><span>+{totalTax.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white border-t pt-2 dark:border-slate-700">
                                <span>TOTAL</span><span>{grandTotal.toFixed(2)}</span>
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
                                        {change >= 0 ? `+${change.toFixed(2)}` : `${(paid - grandTotal).toFixed(2)}`}
                                    </span>
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || submitting || paid < grandTotal}
                            className="w-full h-11 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {submitting ? "Processing…" : `Checkout — ${grandTotal.toFixed(2)}`}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
