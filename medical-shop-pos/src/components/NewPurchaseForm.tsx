import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiSupplier, ApiProduct, ApiProductBatch, productApi } from "@/lib/inventory";
import { CreatePurchasePayload } from "@/lib/purchases";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/ToastProvider";
import { Search, X } from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generatePurchaseNumber() {
    const now = new Date();
    return `PO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function generateBatchNumber() {
    const now = new Date();
    return `BN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const lineSchema = z.discriminatedUnion("selectedBatchMode", [
    z.object({
        selectedBatchMode: z.literal("new"),
        product_id: z.string().min(1),
        product_name: z.string(),
        batch_id: z.string().nullable().optional(),
        batch_number: z.string().min(1, "Batch number is required"),
        expiry_date: z.string().min(1, "Expiry date is required"),
        manufacture_date: z.string().optional(),
        quantity: z.coerce.number().min(1, "Quantity must be ≥ 1"),
        purchase_price: z.coerce.number().min(0, "Cannot be negative"),
        selling_price: z.coerce.number().min(0, "Cannot be negative"),
        mrp: z.coerce.number().min(0).optional(),
        total: z.coerce.number().min(0),
        existingBatches: z.any().optional(),
    }).refine(d => d.selling_price >= d.purchase_price, {
        message: "Selling price must be ≥ purchase price",
        path: ["selling_price"],
    }),
    z.object({
        selectedBatchMode: z.literal("existing"),
        product_id: z.string().min(1),
        product_name: z.string(),
        batch_id: z.string().min(1, "Please select a batch"),
        batch_number: z.string().optional(),
        expiry_date: z.string().optional(),
        manufacture_date: z.string().optional(),
        quantity: z.coerce.number().min(1, "Quantity must be ≥ 1"),
        purchase_price: z.coerce.number().min(0, "Cannot be negative"),
        selling_price: z.coerce.number().min(0, "Cannot be negative"),
        mrp: z.coerce.number().min(0).optional(),
        total: z.coerce.number().min(0),
        existingBatches: z.any().optional(),
    }),
]);

const schema = z.object({
    supplier_id: z.string().min(1, "Please select a supplier"),
    purchase_number: z.string().min(1, "PO number is required"),
    purchased_at: z.string().optional(),
    status: z.enum(["pending", "received"]),
    discount: z.coerce.number().min(0),
    tax: z.coerce.number().min(0),
    notes: z.string().optional(),
    items: z.array(lineSchema).min(1, "Add at least one product"),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    suppliers: ApiSupplier[];
    products: ApiProduct[];
    onSubmit: (data: CreatePurchasePayload) => Promise<void>;
    onCancel: () => void;
}

// ─── Helper component: field error message ──────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export function NewPurchaseForm({ suppliers, products, onSubmit, onCancel }: Props) {
    const toast = useToast();

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
            supplier_id: "",
            purchase_number: generatePurchaseNumber(),
            purchased_at: new Date().toISOString().slice(0, 10),
            status: "pending",
            discount: 0,
            tax: 0,
            notes: "",
            items: [],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "items" });

    const [productSearch, setProductSearch] = useState("");
    const watchedItems = watch("items");
    const watchedDiscount = watch("discount") ?? 0;
    const watchedTax = watch("tax") ?? 0;

    const subtotal = (watchedItems ?? []).reduce((s, l) => s + (Number(l.total) || 0), 0);
    const grandTotal = subtotal - Number(watchedDiscount) + Number(watchedTax);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.generic_name ?? "").toLowerCase().includes(productSearch.toLowerCase())
    );

    const addProduct = async (p: ApiProduct) => {
        setProductSearch("");
        let batches: ApiProductBatch[] = [];
        try { batches = await productApi.batches(p.id); } catch { /**/ }

        append({
            product_id: p.id,
            product_name: p.name,
            batch_id: null,
            batch_number: generateBatchNumber(),
            expiry_date: "",
            manufacture_date: "",
            quantity: 1,
            purchase_price: 0,
            selling_price: p.mrp ?? 0,
            mrp: p.mrp ?? 0,
            total: 0,
            existingBatches: batches,
            selectedBatchMode: "new",
        } as any);
    };

    // Recalculate line total when qty or purchase_price changes
    useEffect(() => {
        watchedItems?.forEach((item, idx) => {
            const computed = Number(item.purchase_price) * Number(item.quantity);
            if (computed !== Number(item.total)) {
                setValue(`items.${idx}.total`, computed);
            }
        });
    }, [JSON.stringify(watchedItems?.map(i => [i.purchase_price, i.quantity]))]);

    const handleBatchModeSwitch = (idx: number, mode: "new" | "existing") => {
        if (mode === "existing") {
            setValue(`items.${idx}.selectedBatchMode`, "existing" as any);
            setValue(`items.${idx}.batch_number`, "");
            setValue(`items.${idx}.expiry_date`, "");
            setValue(`items.${idx}.manufacture_date`, "");
        } else {
            setValue(`items.${idx}.selectedBatchMode`, "new" as any);
            setValue(`items.${idx}.batch_id`, null);
            setValue(`items.${idx}.batch_number`, generateBatchNumber());
        }
    };

    const handleBatchSelect = (idx: number, batchId: string) => {
        const batches: ApiProductBatch[] = watchedItems[idx].existingBatches ?? [];
        const batch = batches.find(b => b.id === batchId);
        setValue(`items.${idx}.batch_id`, batchId);
        if (batch) {
            if (batch.purchase_price) setValue(`items.${idx}.purchase_price`, batch.purchase_price);
            if (batch.selling_price) setValue(`items.${idx}.selling_price`, batch.selling_price);
            if (batch.mrp) setValue(`items.${idx}.mrp`, batch.mrp);
            const qty = Number(watchedItems[idx].quantity);
            setValue(`items.${idx}.total`, (batch.purchase_price ?? 0) * qty);
        }
    };

    const processSubmit = async (values: FormValues) => {
        try {
            const payload: CreatePurchasePayload = {
                supplier_id: values.supplier_id,
                purchase_number: values.purchase_number,
                status: values.status,
                subtotal,
                discount: Number(values.discount),
                tax: Number(values.tax),
                total: grandTotal,
                purchased_at: values.purchased_at || null,
                notes: values.notes || null,
                items: values.items.map(l => ({
                    product_id: l.product_id,
                    batch_id: l.selectedBatchMode === "existing" ? l.batch_id ?? null : null,
                    quantity: Number(l.quantity),
                    purchase_price: Number(l.purchase_price),
                    selling_price: Number(l.selling_price),
                    mrp: l.mrp ? Number(l.mrp) : null,
                    total: Number(l.total),
                    batch_number: l.selectedBatchMode === "new" ? l.batch_number ?? null : null,
                    manufacture_date: l.selectedBatchMode === "new" ? l.manufacture_date ?? null : null,
                    expiry_date: l.selectedBatchMode === "new" ? l.expiry_date ?? null : null,
                })),
            };
            await onSubmit(payload);
            toast.success("Purchase order saved successfully.");
        } catch (error) {
            console.error("Failed to save purchase:", error);
            toast.error("Failed to save purchase order. Please check the form and try again.");
        }
    };

    // Typed error helpers for nested items
    const itemErrors = (errors.items as any) ?? [];
    const getItemError = (idx: number, field: string): string | undefined =>
        itemErrors?.[idx]?.[field]?.message;

    return (
        <form onSubmit={handleSubmit(processSubmit as any)} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300" noValidate>

            {/* ── Header ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">New Purchase Order</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                    {/* Supplier */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Supplier *</label>
                        <Controller
                            control={control}
                            name="supplier_id"
                            render={({ field }) => (
                                <SelectMenu
                                    value={field.value}
                                    onChange={field.onChange}
                                    options={[
                                        { value: "", label: "Select supplier…" },
                                        ...suppliers.filter(s => s.is_active).map(s => ({
                                            value: s.id,
                                            label: s.name,
                                        }))
                                    ]}
                                />
                            )}
                        />
                        <FieldError message={errors.supplier_id?.message} />
                    </div>

                    {/* PO Number */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">PO Number *</label>
                        <Input {...register("purchase_number")} />
                        <FieldError message={errors.purchase_number?.message} />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
                        <Input type="date" {...register("purchased_at")} />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                        <Controller
                            control={control}
                            name="status"
                            render={({ field }) => (
                                <SelectMenu
                                    value={field.value}
                                    onChange={field.onChange}
                                    options={[
                                        { value: "pending", label: "Pending (order placed)" },
                                        { value: "received", label: "Received (stock now in)" }
                                    ]}
                                />
                            )}
                        />
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
                        <Input {...register("notes")} placeholder="Optional notes…" />
                    </div>
                </CardContent>
            </Card>

            {/* ── Product search ── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Add Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            className="pl-9"
                            placeholder="Search product to add…"
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                        />
                    </div>
                    {productSearch && (
                        <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-md max-h-52 overflow-y-auto shadow-sm">
                            {filteredProducts.length === 0 ? (
                                <div className="p-3 text-sm text-slate-500">No matching products.</div>
                            ) : (
                                filteredProducts.slice(0, 15).map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => addProduct(p)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-left"
                                    >
                                        <span>
                                            <span className="font-medium">{p.name}</span>
                                            {p.generic_name && <span className="ml-2 text-slate-400 text-xs italic">{p.generic_name}</span>}
                                        </span>
                                        <span className="text-xs text-slate-400 ml-4">{p.unit ?? ""}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                    {/* Show items-level error (e.g. "Add at least one product") */}
                    {errors.items && !Array.isArray(errors.items) && (
                        <p className="mt-2 text-sm text-red-500">{(errors.items as any).message}</p>
                    )}
                </CardContent>
            </Card>

            {/* ── Line items ── */}
            {fields.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Order Lines ({fields.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, idx) => {
                            const mode = watchedItems?.[idx]?.selectedBatchMode ?? "new";
                            const existingBatches: ApiProductBatch[] = watchedItems?.[idx]?.existingBatches ?? [];

                            return (
                                <div key={field.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3 hover:border-emerald-300 transition-colors">
                                    {/* Product name & remove */}
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-slate-800 dark:text-slate-100">
                                            {watchedItems?.[idx]?.product_name}
                                        </p>
                                        <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Batch mode toggle */}
                                    {existingBatches.length > 0 && (
                                        <div className="flex rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 w-fit text-xs font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleBatchModeSwitch(idx, "existing")}
                                                className={`px-3 py-1.5 transition-colors ${mode === "existing" ? "bg-emerald-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"}`}
                                            >
                                                Use Existing Batch
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleBatchModeSwitch(idx, "new")}
                                                className={`px-3 py-1.5 transition-colors ${mode === "new" ? "bg-emerald-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"}`}
                                            >
                                                New Batch
                                            </button>
                                        </div>
                                    )}

                                    {/* Qty / Prices */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Qty *</label>
                                            <Input type="number" min={1} {...register(`items.${idx}.quantity`)} />
                                            <FieldError message={getItemError(idx, "quantity")} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Purchase Price *</label>
                                            <Input type="number" min={0} step="0.01" {...register(`items.${idx}.purchase_price`)} />
                                            <FieldError message={getItemError(idx, "purchase_price")} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Selling Price *</label>
                                            <Input
                                                type="number" min={0} step="0.01"
                                                {...register(`items.${idx}.selling_price`)}
                                                disabled={mode === "existing"}
                                            />
                                            <FieldError message={getItemError(idx, "selling_price")} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">MRP</label>
                                            <Input
                                                type="number" min={0} step="0.01"
                                                {...register(`items.${idx}.mrp`)}
                                                disabled={mode === "existing"}
                                            />
                                            <FieldError message={getItemError(idx, "mrp")} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Line Total</label>
                                            <div className="h-10 flex items-center px-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-md text-sm font-medium">
                                                {Number(watchedItems?.[idx]?.total ?? 0).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Existing batch select */}
                                    {mode === "existing" && existingBatches.length > 0 && (
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Select Batch *</label>
                                            <Controller
                                                control={control}
                                                name={`items.${idx}.batch_id` as any}
                                                render={({ field: f }) => (
                                                    <SelectMenu
                                                        value={f.value ?? ""}
                                                        onChange={val => {
                                                            f.onChange(val);
                                                            handleBatchSelect(idx, val);
                                                        }}
                                                        options={[
                                                            { value: "", label: "Choose a batch…" },
                                                            ...existingBatches.map(b => ({
                                                                value: b.id,
                                                                label: `${b.batch_number} — Exp: ${b.expiry_date ?? "N/A"} (Stock: ${b.quantity})`
                                                            }))
                                                        ]}
                                                    />
                                                )}
                                            />
                                            <FieldError message={getItemError(idx, "batch_id")} />
                                        </div>
                                    )}

                                    {/* New batch fields */}
                                    {mode === "new" && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-xs text-slate-500 mb-1 block">Batch Number *</label>
                                                <Input placeholder="e.g. B-2024-001" {...register(`items.${idx}.batch_number`)} />
                                                <FieldError message={getItemError(idx, "batch_number")} />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 mb-1 block">Manufacture Date</label>
                                                <Input type="date" {...register(`items.${idx}.manufacture_date`)} />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 mb-1 block">Expiry Date *</label>
                                                <Input type="date" {...register(`items.${idx}.expiry_date`)} />
                                                <FieldError message={getItemError(idx, "expiry_date")} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            {/* ── Totals + submit ── */}
            <Card>
                <CardContent className="pt-5">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div className="grid grid-cols-2 gap-4 md:w-72">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Discount</label>
                                <Input type="number" min={0} step="0.01" {...register("discount")} />
                                <FieldError message={errors.discount?.message} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Tax</label>
                                <Input type="number" min={0} step="0.01" {...register("tax")} />
                                <FieldError message={errors.tax?.message} />
                            </div>
                        </div>

                        <div className="text-right space-y-1">
                            <div className="text-sm text-slate-500">Subtotal: <span className="font-medium text-slate-700">{subtotal.toFixed(2)}</span></div>
                            <div className="text-sm text-slate-500">Discount: <span className="text-red-500">-{Number(watchedDiscount).toFixed(2)}</span></div>
                            <div className="text-sm text-slate-500">Tax: <span className="text-amber-500">+{Number(watchedTax).toFixed(2)}</span></div>
                            <div className="text-xl font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                                Total: {grandTotal.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-5">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving…" : (watch("status") === "received" ? "Save & Receive Stock" : "Save Order")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
