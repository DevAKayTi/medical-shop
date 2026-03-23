import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from '@headlessui/react';
import { zodResolver } from "@hookform/resolvers/zod";
import { Customer } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/ToastProvider";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const customerSchema = z.object({
    name: z.string().min(1, "Name is required."),
    phone: z.string().min(1, "Phone number is required."),
    address: z.string().optional(),
    loyaltyPoints: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof customerSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface CustomerFormProps {
    initialData?: Customer;
    onSubmit: (customer: Omit<Customer, "id">) => Promise<void> | void;
    onCancel: () => void;
}

// ─── Helper component: field error message ──────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export function CustomerForm({ initialData, onSubmit, onCancel }: CustomerFormProps) {
    const toast = useToast();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(customerSchema) as any,
        defaultValues: {
            name: initialData?.name || "",
            phone: initialData?.phone || "",
            address: initialData?.address || "",
            loyaltyPoints: initialData ? Number(initialData.loyaltyPoints) : 0,
        },
    });

    const processSubmit = async (values: FormValues) => {
        try {
            await onSubmit({
                name: values.name,
                phone: values.phone,
                address: values.address || "",
                loyaltyPoints: values.loyaltyPoints,
            });
            toast.success(initialData ? "Customer updated successfully." : "Customer added successfully.");
        } catch (error: any) {
            console.error("Failed to save customer:", error);
            const msg = error.response?.data?.message || "Failed to save customer. Please check the details and try again.";
            toast.error(msg);
        }
    };

    return (
        <form onSubmit={handleSubmit(processSubmit)} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950" noValidate>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">
                {initialData ? "Edit Customer" : "Add New Customer"}
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Customer Name *</label>
                    <Input
                        {...register("name")}
                        placeholder="e.g. John Doe"
                        className={errors.name ? "border-red-500" : ""}
                    />
                    <FieldError message={errors.name?.message} />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Phone Number *</label>
                    <Input
                        {...register("phone")}
                        placeholder="e.g. +1 234 567 8900"
                        className={errors.phone ? "border-red-500" : ""}
                    />
                    <FieldError message={errors.phone?.message} />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-medium">Address</label>
                    <Textarea
                        {...register("address")}
                        className={`flex min-h-[80px] w-full rounded-md border ${errors.address ? "border-red-500" : "border-slate-300"} bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-emerald-500 dark:focus:ring-offset-slate-900`}
                        placeholder="e.g. 123 Main St, City, Country"
                    />
                    <FieldError message={errors.address?.message} />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Loyalty Points manually adjust</label>
                    <Input
                        type="number"
                        min="0"
                        {...register("loyaltyPoints")}
                        className={errors.loyaltyPoints ? "border-red-500" : ""}
                    />
                    <FieldError message={errors.loyaltyPoints?.message} />
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving…" : initialData ? "Save Changes" : "Add Customer"}
                </Button>
            </div>
        </form>
    );
}
