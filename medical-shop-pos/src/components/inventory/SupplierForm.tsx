import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiSupplier } from "@/lib/inventory";

interface Props {
    onSubmit: (data: Omit<ApiSupplier, "id" | "shop_id">) => Promise<void>;
    onCancel: () => void;
    initialData?: ApiSupplier;
}

export function SupplierForm({ onSubmit, onCancel, initialData }: Props) {
    const [form, setForm] = useState({
        name: initialData?.name ?? "",
        contact_person: initialData?.contact_person ?? "",
        phone: initialData?.phone ?? "",
        email: initialData?.email ?? "",
        address: initialData?.address ?? "",
        is_active: initialData?.is_active ?? true,
    });
    const [loading, setLoading] = useState(false);

    const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit({
            name: form.name,
            contact_person: form.contact_person || null,
            phone: form.phone || null,
            email: form.email || null,
            address: form.address || null,
            is_active: form.is_active,
        });
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-base font-semibold">{initialData ? "Edit Supplier" : "New Supplier"}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Supplier Name *</label>
                    <Input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Pharma Corp Ltd" />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Contact Person</label>
                    <Input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} placeholder="e.g. John Doe" />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Phone</label>
                    <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+95 9 xxx xxxx" />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="contact@supplier.com" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St, Yangon" />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : initialData ? "Save" : "Add"}</Button>
            </div>
        </form>
    );
}
