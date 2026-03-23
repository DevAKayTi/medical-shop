import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { Textarea } from '@headlessui/react';
import { SelectMenu } from "@/components/ui/SelectMenu";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiProduct } from "@/lib/inventory";
import { useToast } from "@/components/ui/ToastProvider";
import { AlertCircle } from "lucide-react";

interface StockAdjustmentFormProps {
    products: ApiProduct[];
    onSave: (data: StockAdjustmentFormValues) => Promise<void>;
    onCancel: () => void;
}

const adjustmentSchema = z.object({
    product_id: z.string().min(1, "Product is required"),
    batch_id: z.string().min(1, "Batch is required"),
    type: z.enum(["increase", "decrease", "write_off", "correction"]),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    reason: z.string().min(5, "Reason must be at least 5 characters"),
});

type StockAdjustmentFormValues = z.infer<typeof adjustmentSchema>;

export function StockAdjustmentForm({ products, onSave, onCancel }: StockAdjustmentFormProps) {
    const toast = useToast();
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<StockAdjustmentFormValues>({
        resolver: zodResolver(adjustmentSchema),
        defaultValues: {
            product_id: "",
            batch_id: "",
            type: "increase",
            quantity: 1,
            reason: "",
        },
    });

    const watchProductId = watch("product_id");

    // Get batches for the selected product
    const productBatches = useMemo(() => {
        const product = products.find(p => p.id === watchProductId);
        return product?.batches ?? [];
    }, [products, watchProductId]);

    // Reset batch_id when product_id changes
    useEffect(() => {
        setValue("batch_id", "");
    }, [watchProductId, setValue]);

    const onFormSubmit = async (values: StockAdjustmentFormValues) => {
        try {
            await onSave(values);
            toast.success("Stock adjustment saved successfully.");
        } catch {
            toast.error("Failed to save stock adjustment.");
        }
    };

    const fieldError = (name: keyof StockAdjustmentFormValues) => {
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
        <Card className="max-w-2xl mx-auto border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">New Stock Adjustment</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 z-30 relative">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Product *</label>
                            <Controller
                                control={control}
                                name="product_id"
                                render={({ field }) => (
                                    <SelectMenu
                                        value={field.value || ""}
                                        onChange={field.onChange}
                                        options={[
                                            { value: "", label: "Select Product..." },
                                            ...products.map(p => ({ value: p.id, label: p.name }))
                                        ]}
                                        className={errors.product_id ? "border-red-500 focus-visible:outline-red-500" : ""}
                                    />
                                )}
                            />
                            {fieldError("product_id")}
                        </div>
                        <div className="space-y-1.5 z-20 relative">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Batch *</label>
                            <Controller
                                control={control}
                                name="batch_id"
                                render={({ field }) => (
                                    <SelectMenu
                                        value={field.value || ""}
                                        onChange={field.onChange}
                                        disabled={!watchProductId}
                                        options={[
                                            { value: "", label: "Select Batch..." },
                                            ...productBatches.map(b => ({ value: b.id, label: `${b.batch_number} (Qty: ${b.quantity})` }))
                                        ]}
                                        className={errors.batch_id ? "border-red-500 focus-visible:outline-red-500" : ""}
                                    />
                                )}
                            />
                            {fieldError("batch_id")}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 z-10 relative">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Adjustment Type *</label>
                            <Controller
                                control={control}
                                name="type"
                                render={({ field }) => (
                                    <SelectMenu
                                        value={field.value || "increase"}
                                        onChange={field.onChange}
                                        options={[
                                            { value: "increase", label: "Stock Increase (+)" },
                                            { value: "decrease", label: "Stock Decrease (-)" },
                                            { value: "write_off", label: "Write-Off (Damage/Expired)" },
                                            { value: "correction", label: "Correction" }
                                        ]}
                                    />
                                )}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quantity *</label>
                            <Input
                                type="number"
                                {...register("quantity", { valueAsNumber: true })}
                                min="1"
                                placeholder="Adjustment quantity"
                                aria-invalid={!!errors.quantity}
                            />
                            {fieldError("quantity")}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reason / Remarks *</label>
                        <Textarea
                            {...register("reason")}
                            placeholder="e.g., Damaged during transport, Stock count correction..."
                            className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                            aria-invalid={!!errors.reason}
                        />
                        {fieldError("reason")}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                                    Processing...
                                </span>
                            ) : "Save Adjustment"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
