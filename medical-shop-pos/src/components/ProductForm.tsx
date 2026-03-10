import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiProduct, ApiCategory } from "@/lib/inventory";

interface Props {
    initialData?: ApiProduct;
    categories: ApiCategory[];
    onSubmit: (data: Partial<ApiProduct>) => Promise<void>;
    onCancel: () => void;
}

const MEDICINE_TYPES = [
    { value: "tablet", label: "Tablet (ဆေးပြား)" },
    { value: "capsule", label: "Capsule (ဆေးတောင့်)" },
    { value: "syrup", label: "Syrup (အရည်ကြည်)" },
    { value: "suspension", label: "Suspension (ဆေးရည် - အနှစ်)" },
    { value: "injection", label: "Injection (ထိုးဆေး)" },
    { value: "infusion", label: "Infusion/IV (ပုလင်းသွင်းဆေး/ပုလင်းချိတ်ဆေး)" },
    { value: "cream", label: "Cream (လိမ်းဆေး - ခရင်မ်)" },
    { value: "ointment", label: "Ointment (လိမ်းဆေးဆီ)" },
    { value: "gel", label: "Gel (ဂျယ်လ်)" },
    { value: "drops", label: "Drops (အစက်ချဆေး - မျက်စဉ်း/နားထဲထည့်ဆေး)" },
    { value: "inhaler", label: "Inhaler (ရှူဆေး)" },
    { value: "spray", label: "Spray (ဖြန်းဆေး)" },
    { value: "powder", label: "Powder (ဆေးမှုန့်)" },
    { value: "suppository", label: "Suppository (စအိုထည့်ဆေး)" },
    { value: "other", label: "Other (အခြား)" }
];

const UNITS = [
    { value: "piece", label: "Piece (အခု/ခု)" },
    { value: "strip", label: "Strip (ဆေးကတ်)" },
    { value: "box", label: "Box (ဆေးဖာ/ဆေးဗူး)" },
    { value: "bottle", label: "Bottle (ပုလင်း)" },
    { value: "vial", label: "Vial (ဆေးပုလင်းသေး)" },
    { value: "ampoule", label: "Ampoule (ဆေးထိုးပြွန်အသေး)" },
    { value: "tube", label: "Tube (ဆေးပြွန်)" },
    { value: "sachet", label: "Sachet (အထုပ်ငယ်)" },
    { value: "pack", label: "Pack (အထုပ်)" },
    { value: "pair", label: "Pair (အစုံ)" }
];

export function ProductForm({ initialData, categories, onSubmit, onCancel }: Props) {
    const [form, setForm] = useState({
        name: "",
        generic_name: "",
        barcode: "",
        sku: "",
        category_id: "",
        medicine_type: "",
        manufacturer: "",
        unit: "strips",
        mrp: "",
        tax_rate: "0",
        is_controlled_drug: false,
        prescription_required: false,
        description: "",
        is_active: true,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setForm({
                name: initialData.name,
                generic_name: initialData.generic_name ?? "",
                barcode: initialData.barcode ?? "",
                sku: initialData.sku ?? "",
                category_id: initialData.category_id ?? "",
                medicine_type: initialData.medicine_type ?? "",
                manufacturer: initialData.manufacturer ?? "",
                unit: initialData.unit ?? "strips",
                mrp: String(initialData.mrp),
                tax_rate: String(initialData.tax_rate ?? 0),
                is_controlled_drug: initialData.is_controlled_drug,
                prescription_required: initialData.prescription_required,
                description: initialData.description ?? "",
                is_active: initialData.is_active,
            });
        }
    }, [initialData]);

    const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        await onSubmit({
            name: form.name,
            generic_name: form.generic_name || null,
            barcode: form.barcode || null,
            sku: form.sku || null,
            category_id: form.category_id || null,
            medicine_type: form.medicine_type || null,
            manufacturer: form.manufacturer || null,
            unit: form.unit || null,
            mrp: parseFloat(form.mrp) || 0,
            tax_rate: parseFloat(form.tax_rate) || 0,
            is_controlled_drug: form.is_controlled_drug,
            prescription_required: form.prescription_required,
            description: form.description || null,
            is_active: form.is_active,
        });
        setLoading(false);
    };

    const selectCls = "flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:text-slate-50";

    return (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {initialData ? "Edit Product" : "Add New Product"}
            </h3>

            {/* ── Basic Info ── */}
            <fieldset className="space-y-4">
                <legend className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Basic Information</legend>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Product / Medicine Name *</label>
                        <Input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Paracetamol 500mg" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Generic Name</label>
                        <Input value={form.generic_name} onChange={e => set("generic_name", e.target.value)} placeholder="e.g. Acetaminophen" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Barcode</label>
                        <Input value={form.barcode} onChange={e => set("barcode", e.target.value)} placeholder="8850222012345" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">SKU</label>
                        <Input value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="PRC-500-01" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Manufacturer</label>
                        <Input value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)} placeholder="e.g. ABC Pharma" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Medicine Type</label>
                        <select value={form.medicine_type} onChange={e => set("medicine_type", e.target.value)} className={selectCls}>
                            <option value="">— Select type —</option>
                            {MEDICINE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Category</label>
                        <select value={form.category_id} onChange={e => set("category_id", e.target.value)} className={selectCls}>
                            <option value="">— No Category —</option>
                            {categories.filter(c => c.is_active || c.id === form.category_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
            </fieldset>

            {/* ── Pricing ── */}
            <fieldset className="space-y-4">
                <legend className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Pricing & Unit</legend>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">MRP *</label>
                        <Input type="number" step="0.01" min="0" required value={form.mrp} onChange={e => set("mrp", e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Tax Rate (%)</label>
                        <Input type="number" step="0.01" min="0" max="100" value={form.tax_rate} onChange={e => set("tax_rate", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Unit</label>
                        <select value={form.unit} onChange={e => set("unit", e.target.value)} className={selectCls}>
                            {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                    </div>
                </div>
            </fieldset>

            {/* ── Flags ── */}
            <fieldset className="space-y-2">
                <legend className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Compliance Flags</legend>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded" checked={form.is_controlled_drug}
                        onChange={e => set("is_controlled_drug", e.target.checked)} />
                    <span className="text-sm">Controlled Drug (Schedule H / Narcotic)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded" checked={form.prescription_required}
                        onChange={e => set("prescription_required", e.target.checked)} />
                    <span className="text-sm">Prescription Required</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded" checked={form.is_active}
                        onChange={e => set("is_active", e.target.checked)} />
                    <span className="text-sm">Active (visible in POS)</span>
                </label>
            </fieldset>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : initialData ? "Save Changes" : "Add Product"}</Button>
            </div>
        </form>
    );
}
