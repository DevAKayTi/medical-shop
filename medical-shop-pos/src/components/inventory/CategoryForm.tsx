import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiCategory } from "@/lib/inventory";

interface Props {
    categories: ApiCategory[];
    onSubmit: (data: { name: string; slug: string; parent_id: string | null }) => Promise<void>;
    onCancel: () => void;
    initialData?: ApiCategory;
}

export function CategoryForm({ categories, onSubmit, onCancel, initialData }: Props) {
    const [name, setName] = useState(initialData?.name ?? "");
    const [slug, setSlug] = useState(initialData?.slug ?? "");
    const [parentId, setParentId] = useState<string>(initialData?.parent_id ?? "");
    const [loading, setLoading] = useState(false);

    const handleNameChange = (val: string) => {
        setName(val);
        if (!initialData) setSlug(val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit({ name, slug, parent_id: parentId || null });
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-base font-semibold">{initialData ? "Edit Category" : "New Category"}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Name *</label>
                    <Input required value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Antibiotics" />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Slug *</label>
                    <Input required value={slug} onChange={e => setSlug(e.target.value)} placeholder="antibiotics" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium">Parent Category</label>
                    <select value={parentId} onChange={e => setParentId(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:text-slate-50">
                        <option value="">— None (top level) —</option>
                        {categories.filter(c => c.id !== initialData?.id).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : initialData ? "Save" : "Add"}</Button>
            </div>
        </form>
    );
}
