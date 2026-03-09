import { useState, useMemo, useEffect } from "react";
import { Product, SaleItem, ShopSettings, storageLib } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus, Minus } from "lucide-react";

interface BillingCartProps {
    cart: SaleItem[];
    onUpdateCart: (cart: SaleItem[]) => void;
    onCheckout: (total: number, tax: number) => void;
    products: Product[];
}

export function BillingCart({ cart, onUpdateCart, onCheckout, products }: BillingCartProps) {
    const [settings, setSettings] = useState<ShopSettings>({
        shopName: "Medical Shop",
        taxRate: 5.0,
        currencySymbol: "$"
    });

    useEffect(() => {
        const s = storageLib.getItem<ShopSettings>("shop_settings");
        if (s) setSettings(s);
    }, []);

    const getProduct = (id: string) => products.find(p => p.id === id);

    const updateQuantity = (index: number, delta: number) => {
        const newCart = [...cart];
        const item = newCart[index];
        const product = getProduct(item.productId);

        if (!product) return;

        const newQuantity = item.quantity + delta;

        if (newQuantity > 0 && newQuantity <= product.quantity) {
            item.quantity = newQuantity;
            onUpdateCart(newCart);
        } else if (newQuantity <= 0) {
            // Remove item
            newCart.splice(index, 1);
            onUpdateCart(newCart);
        } else {
            alert(`Cannot add more than available stock (${product.quantity})`);
        }
    };

    const updateDiscount = (index: number, discountStr: string) => {
        const newCart = [...cart];
        newCart[index].discount = parseFloat(discountStr) || 0;
        onUpdateCart(newCart);
    };

    const removeItem = (index: number) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        onUpdateCart(newCart);
    };

    const subtotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity) - item.discount, 0);
    }, [cart]);

    const taxAmount = useMemo(() => {
        return subtotal * (settings.taxRate / 100);
    }, [subtotal, settings.taxRate]);

    const total = subtotal + taxAmount;

    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 border rounded-md border-dashed border-slate-300 dark:border-slate-800">
                <p>Cart is empty</p>
                <p className="text-sm">Search and click on products to add them to the sale.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto mb-4 border rounded-md divide-y divide-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {cart.map((item, index) => {
                    const product = getProduct(item.productId);
                    if (!product) return null;

                    const itemTotal = (item.price * item.quantity) - item.discount;

                    return (
                        <div key={`${item.productId}-${index}`} className="p-3 text-sm">
                            <div className="flex justify-between font-medium mb-1">
                                <span>{product.name}</span>
                                <span>{settings.currencySymbol}{itemTotal.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center text-slate-500">
                                <span>{settings.currencySymbol}{item.price.toFixed(2)} x</span>

                                <div className="flex items-center space-x-2">
                                    <button onClick={() => updateQuantity(index, -1)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800">
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(index, 1)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800">
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                                <span className="text-xs text-slate-500">Discount: {settings.currencySymbol}</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={item.price * item.quantity}
                                    value={item.discount || ''}
                                    onChange={(e) => updateDiscount(index, e.target.value)}
                                    className="w-16 h-6 px-1 text-xs border rounded dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none"
                                    placeholder="0.00"
                                />
                                <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 ml-4">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border rounded-md space-y-2 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span>{settings.currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tax ({settings.taxRate}%)</span>
                    <span>{settings.currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Total</span>
                    <span className="text-emerald-600">{settings.currencySymbol}{total.toFixed(2)}</span>
                </div>

                <Button
                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onCheckout(total, taxAmount)}
                >
                    Complete Sale
                </Button>
            </div>
        </div>
    );
}
