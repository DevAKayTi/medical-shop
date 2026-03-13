import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiCategory } from "@/lib/inventory";
import { useToast } from "@/components/ui/ToastProvider";
import { AlertCircle } from "lucide-react";

interface Props {
    categories: ApiCategory[];
    onSubmit: (data: { name: string; slug: string; parent_id: string | null }) => Promise<void>;
    onCancel: () => void;
    initialData?: ApiCategory;
}

const categorySchema = z.object({
    name: z.string().min(1, "Name is required").max(191),
    slug: z.string().min(1, "Slug is required").max(191).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and hyphens only"),
    parent_id: z.string().nullable().optional().or(z.literal("")),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function CategoryForm({ categories, onSubmit, onCancel, initialData }: Props) {
    const toast = useToast();
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: initialData?.name ?? "",
            slug: initialData?.slug ?? "",
            parent_id: initialData?.parent_id ?? "",
        },
    });

    const watchName = watch("name");

    // Auto-slug generation for new categories
    useEffect(() => {
        if (!initialData && watchName) {
            const generatedSlug = watchName
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");
            setValue("slug", generatedSlug, { shouldValidate: true });
        }
    }, [watchName, setValue, initialData]);

    const onFormSubmit = async (values: CategoryFormValues) => {
        try {
            await onSubmit({
                name: values.name,
                slug: values.slug,
                parent_id: values.parent_id || null,
            });
            toast.success(initialData ? "Category updated successfully." : "Category created successfully.");
        } catch {
            toast.error(initialData ? "Failed to update category." : "Failed to create category.");
        }
    };

    const fieldError = (name: keyof CategoryFormValues) => {
        const error = errors[name];
        if (!error) return null;
        return (
            <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium mt-1">
                <AlertCircle className="h-3 w-3" />
                {error.message}
            </p>
        );
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit as any)} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-base font-semibold">{initialData ? "Edit Category" : "New Category"}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                        {...register("name")}
                        placeholder="e.g. Antibiotics"
                        aria-invalid={!!errors.name}
                    />
                    {fieldError("name")}
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Slug *</label>
                    <Input
                        {...register("slug")}
                        placeholder="antibiotics"
                        aria-invalid={!!errors.slug}
                    />
                    {fieldError("slug")}
                </div>
                <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium">Parent Category</label>
                    <select
                        {...register("parent_id")}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:text-slate-50"
                    >
                        <option value="">— None (top level) —</option>
                        {categories.filter(c => c.id !== initialData?.id).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : initialData ? "Save" : "Add"}
                </Button>
            </div>
        </form>
    );
}
