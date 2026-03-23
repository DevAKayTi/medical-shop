import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { SelectMenu } from "@/components/ui/SelectMenu";
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
        control,
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
                <div className="space-y-1 sm:col-span-2 relative z-10">
                    <label className="text-sm font-medium">Parent Category</label>
                    <Controller
                        control={control}
                        name="parent_id"
                        render={({ field }) => (
                            <SelectMenu
                                value={field.value || ""}
                                onChange={field.onChange}
                                options={[
                                    { value: "", label: "— None (top level) —" },
                                    ...categories.filter(c => c.id !== initialData?.id).map(c => ({ value: c.id, label: c.name }))
                                ]}
                            />
                        )}
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto">
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="w-full sm:w-auto font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                        </span>
                    ) : initialData ? "Confirm Update" : "Create Category"}
                </Button>
            </div>
        </form>
    );
}
