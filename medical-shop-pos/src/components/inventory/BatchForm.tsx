import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiProductBatch, ApiSupplier } from "@/lib/inventory";

interface Props {
    productName: string;
    suppliers: ApiSupplier[];
    initialData?: ApiProductBatch | null;
    onSubmit: (data: Omit<ApiProductBatch, "id" | "shop_id" | "product_id" | "is_active" | "supplier">) => Promise<void>;
    onCancel: () => void;
}

export function BatchForm({ productName, suppliers, initialData, onSubmit, onCancel }: Props) {
    const safeISO = (d: string | null | undefined) => {
        if (!d) return "";
        const date = new Date(d);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split('T')[0];
    };

    const [form, setForm] = useState({
        batch_number: initialData?.batch_number ?? "",
        supplier_id: initialData?.supplier_id ?? "",
        manufacture_date: safeISO(initialData?.manufacture_date),
        expiry_date: safeISO(initialData?.expiry_date),
        quantity: initialData?.quantity?.toString() ?? "",
        purchase_price: initialData?.purchase_price?.toString() ?? "",
        selling_price: initialData?.selling_price?.toString() ?? "",
        mrp: initialData?.mrp?.toString() ?? "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const pp = parseFloat(form.purchase_price);
        const sp = parseFloat(form.selling_price);

        if (!isNaN(pp) && !isNaN(sp) && sp < pp) {
            setError("Selling price must be greater than or equal to purchase price.");
            return;
        }

        setLoading(true);
        await onSubmit({
            batch_number: form.batch_number,
            supplier_id: form.supplier_id || null,
            manufacture_date: form.manufacture_date || null,
            expiry_date: form.expiry_date,
            quantity: parseInt(form.quantity) || 0,
            purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
            selling_price: parseFloat(form.selling_price) || 0,
            mrp: form.mrp ? parseFloat(form.mrp) : null,
        });
        setLoading(false);
    };

    const isEditing = !!initialData;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div>
                <h3 className="text-base font-semibold">{isEditing ? "Edit Batch" : "Add Batch"}</h3>
                <p className="text-xs text-slate-500 mt-0.5">For: <span className="font-medium">{productName}</span></p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Batch Number *</label>
                    <Input required value={form.batch_number} onChange={e => set("batch_number", e.target.value)} placeholder="B-2024-001" />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Quantity *</label>
                    <Input type="number" min="0" required value={form.quantity} onChange={e => set("quantity", e.target.value)} placeholder="100" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium">Supplier (Who provided this batch?)</label>
                    <select
                        value={form.supplier_id}
                        onChange={e => set("supplier_id", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900"
                    >
                        <option value="">— Select Supplier —</option>
                        {suppliers.map((s: ApiSupplier) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Manufacture Date</label>
                    <Input type="date" value={form.manufacture_date} onChange={e => set("manufacture_date", e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Expiry Date *</label>
                    <Input type="date" required value={form.expiry_date} onChange={e => set("expiry_date", e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Purchase Price</label>
                    <Input type="number" step="0.01" min="0" value={form.purchase_price} onChange={e => set("purchase_price", e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Selling Price *</label>
                    <Input type="number" step="0.01" min="0" required value={form.selling_price} onChange={e => set("selling_price", e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">MRP</label>
                    <Input type="number" step="0.01" min="0" value={form.mrp} onChange={e => set("mrp", e.target.value)} placeholder="0.00" />
                </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : (isEditing ? "Update Batch" : "Add Batch")}</Button>
            </div>
        </form>
    );
}
