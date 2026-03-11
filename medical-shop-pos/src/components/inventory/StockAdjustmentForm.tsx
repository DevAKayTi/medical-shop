import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
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
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Product *</label>
                            <select
                                {...register("product_id")}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                                aria-invalid={!!errors.product_id}
                            >
                                <option value="">Select Product...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            {fieldError("product_id")}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Batch *</label>
                            <select
                                {...register("batch_id")}
                                disabled={!watchProductId}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                                aria-invalid={!!errors.batch_id}
                            >
                                <option value="">Select Batch...</option>
                                {productBatches.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.batch_number} (Qty: {b.quantity})
                                    </option>
                                ))}
                            </select>
                            {fieldError("batch_id")}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Adjustment Type *</label>
                            <select
                                {...register("type")}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                            >
                                <option value="increase">Stock Increase (+)</option>
                                <option value="decrease">Stock Decrease (-)</option>
                                <option value="write_off">Write-Off (Damage/Expired)</option>
                                <option value="correction">Correction</option>
                            </select>
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
                        <textarea
                            {...register("reason")}
                            placeholder="e.g., Damaged during transport, Stock count correction..."
                            className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                            aria-invalid={!!errors.reason}
                        />
                        {fieldError("reason")}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Processing..." : "Save Adjustment"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
