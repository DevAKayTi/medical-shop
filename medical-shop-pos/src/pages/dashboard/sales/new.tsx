import { useState, useEffect, useRef } from "react";
import { Product, Sale, SaleItem, Customer, storageLib } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BillingCart } from "@/components/BillingCart";
import { PrescriptionForm, PrescriptionDetails } from "@/components/PrescriptionForm";
import { Search, StickyNote, FileText, CheckCircle2 } from "lucide-react";
import { useReactToPrint } from "react-to-print"; // We will add this dependency for print

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState<SaleItem[]>([]);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
    const [prescription, setPrescription] = useState<PrescriptionDetails | null>(null);

    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setProducts(storageLib.getItem<Product[]>("products") || []);
        setCustomers(storageLib.getItem<Customer[]>("customers") || []);
    }, []);

    const filteredProducts = products.filter(p =>
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())) &&
        p.quantity > 0 // Only show available products
    );

    const addToCart = (product: Product) => {
        const existingIndex = cart.findIndex(item => item.productId === product.id);

        if (existingIndex >= 0) {
            if (cart[existingIndex].quantity < product.quantity) {
                const newCart = [...cart];
                newCart[existingIndex].quantity += 1;
                setCart(newCart);
            } else {
                alert("Cannot add more: insufficient stock.");
            }
        } else {
            setCart([...cart, {
                productId: product.id,
                quantity: 1,
                price: product.price,
                discount: 0
            }]);
        }
    };

    const handleCheckout = (total: number, tax: number) => {
        const authUser = storageLib.getAuthUser();
        if (!authUser) return;

        // Save Prescription if mapped
        let presId;
        if (prescription) {
            presId = `pres-${Date.now()}`;
            const presData = storageLib.getItem<any[]>("prescriptions") || [];
            presData.push({
                id: presId,
                ...prescription,
                saleTimestamp: new Date().toISOString()
            });
            storageLib.setItem("prescriptions", presData);
        }

        // Save Sale
        const newSale: Sale = {
            id: `rcpt-${Date.now()}`,
            items: cart,
            total,
            tax,
            customerId: selectedCustomerId || undefined,
            prescriptionId: presId,
            timestamp: new Date().toISOString(),
            cashierId: authUser.id
        };

        const salesList = storageLib.getItem<Sale[]>("sales") || [];
        salesList.push(newSale);
        storageLib.setItem("sales", salesList);

        // Deduct exact Inventory quantities
        const latestProducts = storageLib.getItem<Product[]>("products") || [];
        cart.forEach(cartItem => {
            const pIndex = latestProducts.findIndex(p => p.id === cartItem.productId);
            if (pIndex !== -1) {
                latestProducts[pIndex].quantity -= cartItem.quantity;
            }
        });
        storageLib.setItem("products", latestProducts);
        setProducts(latestProducts);

        // Customer Loyalty Points Update (optional logic: 1 pt per $10 spent)
        if (selectedCustomerId) {
            const latestCustomers = storageLib.getItem<Customer[]>("customers") || [];
            const cIndex = latestCustomers.findIndex(c => c.id === selectedCustomerId);
            if (cIndex !== -1) {
                const pointsGained = Math.floor(total / 10);
                latestCustomers[cIndex].loyaltyPoints += pointsGained;
                storageLib.setItem("customers", latestCustomers);
            }
        }

        setLastSale(newSale);
        // Reset form
        setCart([]);
        setPrescription(null);
        setSelectedCustomerId("");
        setShowPrescriptionForm(false);
    };

    const resetNewSale = () => setLastSale(null);

    // We handle print styling globally or inline
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
    });

    if (lastSale) {
        const sSettings = storageLib.getItem<any>("shop_settings") || {};
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 animate-in fade-in duration-500">
                <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center h-16 w-16 shadow-sm dark:bg-emerald-900/30 dark:border-emerald-800">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold">Transaction Successful</h2>
                <p className="text-slate-500">Receipt ID: {lastSale.id}</p>

                <div className="flex space-x-4">
                    <Button onClick={handlePrint} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300">
                        <FileText className="mr-2 h-4 w-4" /> Print Receipt
                    </Button>
                    <Button onClick={resetNewSale}>New Transaction</Button>
                </div>

                {/* Hidden receipt block for printing */}
                <div className="hidden">
                    <div ref={receiptRef} className="p-8 w-[300px] text-black bg-white">
                        <h1 className="text-xl font-bold text-center border-b pb-2 mb-2">{sSettings.shopName || "Medical Store"}</h1>
                        <p className="text-xs text-center mb-4">{new Date(lastSale.timestamp).toLocaleString()}</p>
                        <p className="text-xs mb-2">Receipt: {lastSale.id}</p>

                        <div className="border-b border-t py-2 space-y-1 my-2">
                            {lastSale.items.map((item, idx) => {
                                const prod = products.find(p => p.id === item.productId);
                                return (
                                    <div key={idx} className="flex justify-between text-xs">
                                        <span>{item.quantity}x {prod?.name || "Item"}</span>
                                        <span>${((item.price * item.quantity) - item.discount).toFixed(2)}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-between text-sm font-bold mt-2">
                            <span>Total</span>
                            <span>${lastSale.total.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-center mt-6">Thank you for your visit!</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 h-full flex flex-col xl:flex-row gap-4 animate-in fade-in duration-500">

            {/* LEFT COLUMN - Products Database */}
            <div className="flex-1 flex flex-col space-y-4">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Point of Sale (POS)</h1>

                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="pb-4 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <Input
                                type="search"
                                placeholder="Scan barcode or search medicine name / batch..."
                                className="pl-9 h-10 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="border rounded-md p-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:border-blue-500/50 dark:hover:bg-blue-900/20 flex flex-col justify-between h-28"
                                >
                                    <div>
                                        <p className="font-semibold text-sm line-clamp-2">{product.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{product.sku}</p>
                                    </div>
                                    <div className="flex justify-between items-center w-full mt-2">
                                        <span className="font-bold text-slate-900 dark:text-slate-100">${product.price.toFixed(2)}</span>
                                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 border dark:border-slate-700">Stk: {product.quantity}</span>
                                    </div>
                                </div>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-500">
                                    No available products found matching your search.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN - Billing Cart */}
            <div className="w-full xl:w-96 flex flex-col space-y-4 shrink-0">
                <Card className="flex-1 flex flex-col h-full overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-slate-50 border-b dark:bg-slate-900/50 dark:border-slate-800 shrink-0">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">Current Sale</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-4 flex flex-col">

                        {/* Sale Context Setup */}
                        <div className="space-y-3 mb-4 shrink-0 border-b pb-4 dark:border-slate-800">
                            <div className="flex space-x-2">
                                <select
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    className="flex-1 h-9 rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:text-slate-50"
                                >
                                    <option value="">Walk-in Customer</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                                    ))}
                                </select>
                                <Button
                                    variant={prescription ? "default" : "outline"}
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    onClick={() => setShowPrescriptionForm(!showPrescriptionForm)}
                                    title={prescription ? "Prescription Attached" : "Attach Prescription"}
                                >
                                    <StickyNote className="h-4 w-4" />
                                </Button>
                            </div>

                            {showPrescriptionForm && (
                                <div className="mt-2 animate-in slide-in-from-top-2">
                                    <PrescriptionForm
                                        initialData={prescription}
                                        onSave={(data) => { setPrescription(data); setShowPrescriptionForm(false); }}
                                        onCancel={() => setShowPrescriptionForm(false)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Cart Component */}
                        <BillingCart
                            cart={cart}
                            onUpdateCart={setCart}
                            onCheckout={handleCheckout}
                            products={products}
                        />

                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
