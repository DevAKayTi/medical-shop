import { useState } from "react";
import { ApiSupplier, ApiProduct, ApiProductBatch, productApi } from "@/lib/inventory";
import { CreatePurchasePayload } from "@/lib/purchases";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Search, X } from "lucide-react";

interface Props {
    suppliers: ApiSupplier[];
    products: ApiProduct[];
    onSubmit: (data: CreatePurchasePayload) => Promise<void>;
    onCancel: () => void;
}

interface LineItem {
    product_id: string;
    product_name: string;
    batch_id?: string | null;
    batch_number?: string;
    expiry_date?: string;
    manufacture_date?: string;
    quantity: number;
    purchase_price: number;
    mrp?: number;
    total: number;
    existingBatches?: ApiProductBatch[];
    selectedBatchMode: 'existing' | 'new';
}

function generatePurchaseNumber() {
    const now = new Date();
    return `PO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export function NewPurchaseForm({ suppliers, products, onSubmit, onCancel }: Props) {
    const [supplierId, setSupplierId] = useState("");
    const [purchaseNumber, setPurchaseNumber] = useState(generatePurchaseNumber());
    const [purchasedAt, setPurchasedAt] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState("");
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
    const [status, setStatus] = useState<'pending' | 'received'>('pending');
    const [lines, setLines] = useState<LineItem[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.generic_name || "").toLowerCase().includes(productSearch.toLowerCase())
    );

    const addProduct = async (p: ApiProduct) => {
        setProductSearch("");
        let batches: ApiProductBatch[] = [];
        try {
            batches = await productApi.batches(p.id);
        } catch { /**/ }

        const newLine: LineItem = {
            product_id: p.id,
            product_name: p.name,
            batch_id: null,
            quantity: 1,
            purchase_price: p.purchase_price || 0,
            mrp: p.mrp || 0,
            total: p.purchase_price || 0,
            existingBatches: batches,
            selectedBatchMode: 'new',
        };
        setLines(prev => [...prev, newLine]);
    };

    const updateLine = (idx: number, field: keyof LineItem, value: any) => {
        setLines(prev => prev.map((l, i) => {
            if (i !== idx) return l;
            const updated = { ...l, [field]: value };
            // Recalculate total
            updated.total = Number(updated.purchase_price) * Number(updated.quantity);
            // If batch mode switches to existing, reset batch fields
            if (field === 'selectedBatchMode' && value === 'existing') {
                updated.batch_number = '';
                updated.expiry_date = '';
                updated.manufacture_date = '';
            }
            if (field === 'selectedBatchMode' && value === 'new') {
                updated.batch_id = null;
            }
            if (field === 'batch_id') {
                const batch = l.existingBatches?.find(b => b.id === value);
                if (batch) {
                    updated.purchase_price = batch.purchase_price || l.purchase_price;
                    updated.mrp = batch.mrp || l.mrp;
                    updated.total = Number(updated.purchase_price) * Number(updated.quantity);
                }
            }
            return updated;
        }));
    };

    const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

    const subtotal = lines.reduce((s, l) => s + (l.total || 0), 0);
    const total = subtotal - Number(discount) + Number(tax);

    const validate = () => {
        const errs: string[] = [];
        if (!supplierId) errs.push("Please select a supplier.");
        if (lines.length === 0) errs.push("Add at least one product.");
        lines.forEach((l, i) => {
            if (!l.quantity || l.quantity < 1) errs.push(`Line ${i + 1}: Quantity must be ≥ 1.`);
            if (l.purchase_price < 0) errs.push(`Line ${i + 1}: Price cannot be negative.`);
            if (l.selectedBatchMode === 'new' && !l.expiry_date) errs.push(`Line ${i + 1}: Expiry date is required for a new batch.`);
            if (l.selectedBatchMode === 'existing' && !l.batch_id) errs.push(`Line ${i + 1}: Please select an existing batch.`);
        });
        setErrors(errs);
        return errs.length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const payload: CreatePurchasePayload = {
                supplier_id: supplierId,
                purchase_number: purchaseNumber,
                status,
                subtotal,
                discount: Number(discount),
                tax: Number(tax),
                total,
                purchased_at: purchasedAt || null,
                notes: notes || null,
                items: lines.map(l => ({
                    product_id: l.product_id,
                    batch_id: l.selectedBatchMode === 'existing' ? l.batch_id : null,
                    quantity: Number(l.quantity),
                    purchase_price: Number(l.purchase_price),
                    mrp: l.mrp ? Number(l.mrp) : null,
                    total: Number(l.total),
                    batch_number: l.selectedBatchMode === 'new' ? l.batch_number || null : null,
                    manufacture_date: l.selectedBatchMode === 'new' ? l.manufacture_date || null : null,
                    expiry_date: l.selectedBatchMode === 'new' ? l.expiry_date || null : null,
                })),
            };
            await onSubmit(payload);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">New Purchase Order</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Supplier *</label>
                        <select
                            value={supplierId}
                            onChange={e => setSupplierId(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select supplier…</option>
                            {suppliers.filter(s => s.is_active).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">PO Number *</label>
                        <Input value={purchaseNumber} onChange={e => setPurchaseNumber(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
                        <Input type="date" value={purchasedAt} onChange={e => setPurchasedAt(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value as 'pending' | 'received')}
                            className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="pending">Pending (order placed)</option>
                            <option value="received">Received (stock now in)</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
                        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" />
                    </div>
                </CardContent>
            </Card>

            {/* Product search */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Add Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            className="pl-9"
                            placeholder="Search product to add…"
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                        />
                    </div>
                    {productSearch && (
                        <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-md max-h-52 overflow-y-auto shadow-sm">
                            {filteredProducts.length === 0 ? (
                                <div className="p-3 text-sm text-slate-500">No matching products.</div>
                            ) : (
                                filteredProducts.slice(0, 15).map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => addProduct(p)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                                    >
                                        <span>
                                            <span className="font-medium">{p.name}</span>
                                            {p.generic_name && <span className="ml-2 text-slate-400 text-xs italic">{p.generic_name}</span>}
                                        </span>
                                        <span className="text-xs text-slate-400 ml-4">{p.unit || ""}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Line items */}
            {lines.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Order Lines ({lines.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {lines.map((line, idx) => (
                            <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3 hover:border-blue-300 transition-colors">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-slate-800 dark:text-slate-100">{line.product_name}</p>
                                    <button type="button" onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Batch mode selector */}
                                {line.existingBatches && line.existingBatches.length > 0 && (
                                    <div className="flex rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 w-fit text-xs font-medium">
                                        <button
                                            type="button"
                                            onClick={() => updateLine(idx, 'selectedBatchMode', 'existing')}
                                            className={`px-3 py-1.5 transition-colors ${line.selectedBatchMode === 'existing' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
                                        >
                                            Use Existing Batch
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateLine(idx, 'selectedBatchMode', 'new')}
                                            className={`px-3 py-1.5 transition-colors ${line.selectedBatchMode === 'new' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
                                        >
                                            New Batch
                                        </button>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Qty *</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={line.quantity}
                                            onChange={e => updateLine(idx, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Purchase Price *</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={line.purchase_price}
                                            onChange={e => updateLine(idx, 'purchase_price', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">MRP</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={line.mrp || ""}
                                            onChange={e => updateLine(idx, 'mrp', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Line Total</label>
                                        <div className="h-10 flex items-center px-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-md text-sm font-medium">
                                            {Number(line.total).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* Batch fields */}
                                {line.selectedBatchMode === 'existing' && line.existingBatches && (
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Select Batch *</label>
                                        <select
                                            value={line.batch_id || ""}
                                            onChange={e => updateLine(idx, 'batch_id', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Choose a batch…</option>
                                            {line.existingBatches.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.batch_number} — Exp: {b.expiry_date} (Stock: {b.quantity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {line.selectedBatchMode === 'new' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Batch Number</label>
                                            <Input
                                                placeholder="e.g. B-2024-001"
                                                value={line.batch_number || ""}
                                                onChange={e => updateLine(idx, 'batch_number', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Manufacture Date</label>
                                            <Input
                                                type="date"
                                                value={line.manufacture_date || ""}
                                                onChange={e => updateLine(idx, 'manufacture_date', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Expiry Date *</label>
                                            <Input
                                                type="date"
                                                value={line.expiry_date || ""}
                                                onChange={e => updateLine(idx, 'expiry_date', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Totals + submit */}
            <Card>
                <CardContent className="pt-5">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div className="grid grid-cols-2 gap-4 md:w-72">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Discount</label>
                                <Input type="number" min={0} step="0.01" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Tax</label>
                                <Input type="number" min={0} step="0.01" value={tax} onChange={e => setTax(Number(e.target.value))} />
                            </div>
                        </div>

                        <div className="text-right space-y-1">
                            <div className="text-sm text-slate-500">Subtotal: <span className="font-medium text-slate-700">{subtotal.toFixed(2)}</span></div>
                            <div className="text-sm text-slate-500">Discount: <span className="text-red-500">-{Number(discount).toFixed(2)}</span></div>
                            <div className="text-sm text-slate-500">Tax: <span className="text-amber-500">+{Number(tax).toFixed(2)}</span></div>
                            <div className="text-xl font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                                Total: {total.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {errors.length > 0 && (
                        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 space-y-1">
                            {errors.map((e, i) => <p key={i} className="text-sm text-red-600 dark:text-red-400">{e}</p>)}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-5">
                        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving ? "Saving…" : (status === 'received' ? "Save & Receive Stock" : "Save Order")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
