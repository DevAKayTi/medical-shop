import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { Select } from '@headlessui/react';
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiPurchase } from "@/lib/purchases";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/ToastProvider";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const returnLineSchema = z.object({
    purchase_item_id: z.string(),
    product_id: z.string(),
    product_name: z.string(),
    batch_id: z.string().nullable().optional(),
    batch_number: z.string().nullable().optional(),
    max_quantity: z.number(),
    quantity: z.coerce.number()
        .min(0, "Quantity cannot be negative"),
    price: z.coerce.number(),
    total: z.number(),
}).refine(data => data.quantity <= data.max_quantity, {
    message: "Cannot return more than purchased",
    path: ["quantity"],
});

const schema = z.object({
    reason: z.string().optional(),
    status: z.enum(["pending", "completed"]),
    items: z.array(returnLineSchema),
}).refine(data => data.items.some(item => item.quantity > 0), {
    message: "Please specify at least one item to return.",
    path: ["items"],
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    purchase: ApiPurchase;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
}

// ─── Helper component: field error message ──────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export function PurchaseReturnForm({ purchase, onSubmit, onCancel }: Props) {
    const toast = useToast();

    const items = purchase?.items || [];
    const defaultLines = items.map(item => ({
        purchase_item_id: item.id!,
        product_id: item.product_id,
        product_name: item.product?.name || "Unknown Product",
        batch_id: item.batch_id,
        batch_number: item.batch?.batch_number || item.batch_number,
        max_quantity: Number(item.quantity || 0) - Number(item.returned_quantity || 0),
        quantity: 0,
        price: Number(item.purchase_price || 0),
        total: 0,
    }));

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            reason: "",
            status: "completed",
            items: defaultLines,
        },
    });

    const { fields } = useFieldArray({ control, name: "items" });
    const watchedItems = watch("items");

    // Dynamic calculations
    const totalReturnAmount = (watchedItems || []).reduce((sum, l) => sum + (Number(l.total) || 0), 0);
    const hasItemsToReturn = (watchedItems || []).some(l => l.quantity > 0);

    const updateLineQuantity = (idx: number, rawValue: string) => {
        const val = parseInt(rawValue, 10) || 0;
        const line = watchedItems[idx];
        const safeQty = Math.max(0, Math.min(line.max_quantity, val));
        setValue(`items.${idx}.quantity`, safeQty, { shouldValidate: true });
        setValue(`items.${idx}.total`, safeQty * Number(line.price));
    };

    const processSubmit = async (values: FormValues) => {
        try {
            const returnNumber = `PR-${new Date().getTime().toString().slice(-6)}`;

            const payload = {
                purchase_id: purchase.id,
                supplier_id: purchase.supplier_id,
                return_number: returnNumber,
                total: totalReturnAmount,
                reason: values.reason || "",
                status: values.status,
                items: values.items.filter(l => l.quantity > 0).map(l => ({
                    purchase_item_id: l.purchase_item_id,
                    product_id: l.product_id,
                    batch_id: l.batch_id,
                    quantity: l.quantity,
                    price: l.price,
                    total: l.total,
                })),
            };

            await onSubmit(payload);
            toast.success("Purchase return processed successfully.");
        } catch (error: any) {
            console.error("Failed to process purchase return:", error);
            const msg = error.response?.data?.message || "Failed to process purchase return. Please try again.";
            toast.error(msg);
        }
    };

    // Helper for nested item errors
    const itemErrors = (errors.items as any) || [];
    const getItemError = (idx: number, field: string): string | undefined => itemErrors?.[idx]?.[field]?.message;
    const itemsGlobalError = !Array.isArray(errors.items) ? (errors.items as any)?.message : undefined;

    return (
        <form onSubmit={handleSubmit(processSubmit as any)} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300" noValidate>
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Return Items from {purchase.purchase_number}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Return Reason</label>
                        <Input
                            {...register("reason")}
                            placeholder="e.g. Damaged items, Wrong delivery…"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Return Status</label>
                        <Controller
                            control={control}
                            name="status"
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="completed">Completed (Deduct stock now)</option>
                                    <option value="pending">Pending (Review later)</option>
                                </Select>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base text-slate-700 dark:text-slate-300">Select Items to Return</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3">Product / Batch</th>
                                    <th className="px-4 py-3 text-right">Purchased Qty</th>
                                    <th className="px-4 py-3 text-right">Return Qty</th>
                                    <th className="px-4 py-3 text-right">Price</th>
                                    <th className="px-4 py-3 text-right">Refund Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {fields.map((field, idx) => {
                                    const qty = watchedItems[idx]?.quantity || 0;
                                    const isReturning = qty > 0;

                                    return (
                                        <tr key={field.id} className={isReturning ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {watchedItems[idx]?.product_name}
                                                </div>
                                                {watchedItems[idx]?.batch_number && (
                                                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                        Batch: {watchedItems[idx].batch_number}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-500">
                                                {watchedItems[idx]?.max_quantity}
                                            </td>
                                            <td className="px-4 py-3 text-right w-32 align-top">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={watchedItems[idx]?.max_quantity}
                                                    value={qty}
                                                    onChange={e => updateLineQuantity(idx, e.target.value)}
                                                    className={`text-right h-8 ${getItemError(idx, "quantity") ? "border-red-500" : ""}`}
                                                />
                                                <FieldError message={getItemError(idx, "quantity")} />
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-500">
                                                {Number(watchedItems[idx]?.price || 0).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {watchedItems[idx]?.total > 0
                                                    ? watchedItems[idx].total.toFixed(2)
                                                    : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {itemsGlobalError && (
                        <div className="p-4 border-t border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                {itemsGlobalError}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-sm text-slate-500">
                    {hasItemsToReturn ? (
                        <span className="text-blue-600 dark:text-blue-400 font-medium italic">
                            You are returning {(watchedItems || []).filter(l => l.quantity > 0).length} different items.
                        </span>
                    ) : (
                        "Set return quantities above to see total."
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Refund Amount</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                        {totalReturnAmount.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !hasItemsToReturn}>
                    {isSubmitting ? "Processing…" : "Submit Purchase Return"}
                </Button>
            </div>
        </form>
    );
}
