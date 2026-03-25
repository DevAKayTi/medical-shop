import { useEffect, useId } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { Textarea } from '@headlessui/react';
import { SelectMenu } from "@/components/ui/SelectMenu";
import { Checkbox } from "@/components/ui/Checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiProduct, ApiCategory } from "@/lib/inventory";
import { getCurrencySymbol } from "@/lib/currency";
import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm } from "@/hooks/useConfirm";
import { AlertCircle, CheckCircle2 } from "lucide-react";

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

const productSchema = z.object({
    name: z.string().min(1, "Product name is required").max(191),
    generic_name: z.string().max(191).nullable().optional().or(z.literal("")),
    barcode: z.string().max(191).nullable().optional().or(z.literal("")),
    sku: z.string().max(100).nullable().optional().or(z.literal("")),
    category_id: z.string().uuid("Invalid category").nullable().optional().or(z.literal("")),
    medicine_type: z.string().nullable().optional().or(z.literal("")),
    manufacturer: z.string().max(191).nullable().optional().or(z.literal("")),
    unit: z.string().min(1, "Unit is required"),
    mrp: z.coerce.number().min(0, "MRP must be at least 0"),
    is_controlled_drug: z.boolean().default(false),
    prescription_required: z.boolean().default(false),
    description: z.string().nullable().optional().or(z.literal("")),
    is_active: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductForm({ initialData, categories, onSubmit, onCancel }: Props) {
    const id = useId();
    const toast = useToast();
    const [ConfirmDialog, confirm] = useConfirm();

    const {
        register,
        handleSubmit,
        reset,
        control,
        setError,
        clearErrors,
        formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
    } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            name: "",
            generic_name: "",
            barcode: "",
            sku: "",
            category_id: "",
            medicine_type: "",
            manufacturer: "",
            unit: "",
            mrp: 0,
            is_controlled_drug: false,
            prescription_required: false,
            description: "",
            is_active: true,
        },
    });

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                generic_name: initialData.generic_name ?? "",
                barcode: initialData.barcode ?? "",
                sku: initialData.sku ?? "",
                category_id: initialData.category_id ?? "",
                medicine_type: initialData.medicine_type ?? "",
                manufacturer: initialData.manufacturer ?? "",
                unit: initialData.unit ?? "",
                mrp: Number(initialData.mrp),
                is_controlled_drug: !!initialData.is_controlled_drug,
                prescription_required: !!initialData.prescription_required,
                description: initialData.description ?? "",
                is_active: !!initialData.is_active,
            });
        }
    }, [initialData, reset]);

    const onFormSubmit: SubmitHandler<ProductFormValues> = async (values) => {
        clearErrors();
        try {
            // Clean values: empty strings to null for backend
            const cleanValues = Object.fromEntries(
                Object.entries(values).map(([k, v]) => [k, v === "" ? null : v])
            ) as Partial<ApiProduct>;

            await onSubmit(cleanValues);
            toast.success(initialData ? "Product updated successfully." : "Product created successfully.");
        } catch (err: any) {
            console.error("Product submission failed:", err);
            if (err.response?.status === 422 && err.response?.data?.errors) {
                const serverErrors = err.response.data.errors;
                Object.keys(serverErrors).forEach((key) => {
                    setError(key as any, {
                        type: "server",
                        message: serverErrors[key][0],
                    });
                });
                toast.error("Please fix the validation errors.");
            } else {
                setError("root", {
                    message: "An unexpected error occurred. Please try again.",
                });
                toast.error(initialData ? "Failed to update product." : "Failed to create product.");
            }
        }
    };

    const handleCancel = async () => {
        if (isDirty) {
            const isConfirmed = await confirm({
                title: "Unsaved Changes",
                description: "You have unsaved changes. Are you sure you want to cancel?",
                confirmText: "Yes, Cancel",
                variant: "destructive"
            });
            if (!isConfirmed) return;
        }
        onCancel();
    };

    const fieldError = (name: keyof ProductFormValues | "root") => {
        const error = errors[name];
        if (!error) return null;
        return (
            <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium animate-in fade-in slide-in-from-top-1 duration-200" id={`${id}-${name}-error`} role="alert">
                <AlertCircle className="h-3 w-3" />
                {error.message}
            </p>
        );
    };
    const errorCls = "border-red-500 focus:ring-red-500 focus:border-red-500";

    return (
        <form
            onSubmit={handleSubmit(onFormSubmit as any)}
            className="group space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 transition-all duration-300"
            noValidate
        >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                    {initialData ? "Update Product" : "Create New Product"}
                </h3>
                {isSubmitSuccessful && !isDirty && (
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold animate-in zoom-in duration-300">
                        <CheckCircle2 className="h-4 w-4" /> Saved Successfully
                    </div>
                )}
            </div>

            {errors.root && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2 animate-in slide-in-from-left-2 transition-all">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    {errors.root.message}
                </div>
            )}

            {/* ── Basic Info ── */}
            <fieldset className="space-y-4" disabled={isSubmitting}>
                <legend className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Basic Information</legend>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-name`} className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Product / Medicine Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            {...register("name")}
                            id={`${id}-name`}
                            className={errors.name ? errorCls : ""}
                            placeholder="e.g. Paracetamol 500mg"
                            aria-invalid={!!errors.name}
                            aria-describedby={errors.name ? `${id}-name-error` : undefined}
                        />
                        {fieldError("name")}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-generic_name`} className="text-sm font-semibold text-slate-700 dark:text-slate-300">Generic Name</label>
                        <Input
                            {...register("generic_name")}
                            id={`${id}-generic_name`}
                            placeholder="e.g. Acetaminophen"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-barcode`} className="text-sm font-semibold text-slate-700 dark:text-slate-300">Barcode / GTIN</label>
                        <Input
                            {...register("barcode")}
                            id={`${id}-barcode`}
                            className={errors.barcode ? errorCls : ""}
                            placeholder="8850222012345"
                            aria-invalid={!!errors.barcode}
                            aria-describedby={errors.barcode ? `${id}-barcode-error` : undefined}
                        />
                        {fieldError("barcode")}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-sku`} className="text-sm font-semibold text-slate-700 dark:text-slate-300">Internal SKU</label>
                        <Input
                            {...register("sku")}
                            id={`${id}-sku`}
                            className={errors.sku ? errorCls : ""}
                            placeholder="PRC-500-01"
                            aria-invalid={!!errors.sku}
                            aria-describedby={errors.sku ? `${id}-sku-error` : undefined}
                        />
                        {fieldError("sku")}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-manufacturer`} className="text-sm font-semibold text-slate-700 dark:text-slate-300">Manufacturer / Brand</label>
                        <Input
                            {...register("manufacturer")}
                            id={`${id}-manufacturer`}
                            placeholder="e.g. ABC Pharma"
                        />
                    </div>

                    <div className="space-y-1.5 z-30 relative">
                        <label htmlFor={`${id}-medicine_type`} className="text-sm font-semibold text-slate-700 dark:text-slate-300">Medicine Type</label>
                        <Controller
                            control={control}
                            name="medicine_type"
                            render={({ field }) => (
                                <SelectMenu
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    options={[
                                        { value: "", label: "— Select dosage form —" },
                                        ...MEDICINE_TYPES
                                    ]}
                                    className={errors.medicine_type ? errorCls : ""}
                                />
                            )}
                        />
                    </div>

                    <div className="space-y-1.5 z-20 relative">
                        <label htmlFor={`${id}-category_id`} className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
                        <Controller
                            control={control}
                            name="category_id"
                            render={({ field }) => (
                                <SelectMenu
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    options={[
                                        { value: "", label: "— No Category —" },
                                        ...categories.filter(c => c.is_active || c.id === initialData?.category_id).map(c => ({ value: c.id, label: c.name }))
                                    ]}
                                    className={errors.category_id ? errorCls : ""}
                                />
                            )}
                        />
                        {fieldError("category_id")}
                    </div>
                </div>
            </fieldset>

            {/* ── Pricing ── */}
            <fieldset className="space-y-4" disabled={isSubmitting}>
                <legend className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Pricing & Inventory Unit</legend>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-mrp`} className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            MRP <span className="text-sm">({getCurrencySymbol()})</span> <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            {/*  */}
                            <Input
                                {...register("mrp")}
                                id={`${id}-mrp`}
                                type="number"
                                step="any"
                                className={`pl-6 ${errors.mrp ? errorCls : ""}`}
                                placeholder="0.00"
                                aria-invalid={!!errors.mrp}
                            />
                        </div>
                        {fieldError("mrp")}
                    </div>


                    <div className="space-y-1.5 z-10 relative">
                        <label htmlFor={`${id}-unit`} className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Base Unit <span className="text-red-500">*</span>
                        </label>
                        <Controller
                            control={control}
                            name="unit"
                            render={({ field }) => (
                                <SelectMenu
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    options={[
                                        { value: "", label: "— Select unit —" },
                                        ...UNITS
                                    ]}
                                    className={errors.unit ? errorCls : ""}
                                />
                            )}
                        />
                        {fieldError("unit")}
                    </div>
                </div>
            </fieldset>

            {/* ── Descriptions ── */}
            <fieldset className="space-y-1.5" disabled={isSubmitting}>
                <label htmlFor={`${id}-description`} className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description / Usage Notes</label>
                <Textarea
                    {...register("description")}
                    id={`${id}-description`}
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-slate-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    placeholder="Provide additional details about the product..."
                />
            </fieldset>

            {/* ── Flags ── */}
            <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800" disabled={isSubmitting}>
                <label className="flex items-center gap-3 cursor-pointer group/flag">
                    <Controller
                        control={control}
                        name="is_controlled_drug"
                        render={({ field: { onChange, value } }) => (
                            <Checkbox checked={value} onChange={onChange} />
                        )}
                    />
                    <div className="space-y-0.5">
                        <span className="text-sm font-semibold block group-hover/flag:text-emerald-600 transition-colors">Controlled Drug</span>
                        <span className="text-[10px] text-slate-500 hidden sm:block">Schedule H / Narcotic</span>
                    </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group/flag">
                    <Controller
                        control={control}
                        name="prescription_required"
                        render={({ field: { onChange, value } }) => (
                            <Checkbox checked={value} onChange={onChange} />
                        )}
                    />
                    <div className="space-y-0.5">
                        <span className="text-sm font-semibold block group-hover/flag:text-emerald-600 transition-colors">Rx Required</span>
                        <span className="text-[10px] text-slate-500 hidden sm:block">Requires Prescription</span>
                    </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group/flag">
                    <Controller
                        control={control}
                        name="is_active"
                        render={({ field: { onChange, value } }) => (
                            <Checkbox checked={value} onChange={onChange} />
                        )}
                    />
                    <div className="space-y-0.5">
                        <span className="text-sm font-semibold block group-hover/flag:text-emerald-600 transition-colors">Active</span>
                        <span className="text-[10px] text-slate-500 hidden sm:block">Visible in POS & Store</span>
                    </div>
                </label>
            </fieldset>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-900">
                <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={handleCancel}
                    className="w-full sm:w-auto"
                >
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
                    ) : initialData ? "Confirm Update" : "Create Product"}
                </Button>
            </div>

            <ConfirmDialog />
        </form>
    );
}
