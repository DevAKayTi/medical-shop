import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiSupplier } from "@/lib/inventory";
import { useToast } from "@/components/ui/ToastProvider";
import { AlertCircle } from "lucide-react";

interface Props {
    onSubmit: (data: Omit<ApiSupplier, "id" | "shop_id">) => Promise<void>;
    onCancel: () => void;
    initialData?: ApiSupplier;
}

const supplierSchema = z.object({
    name: z.string().min(1, "Supplier name is required").max(191),
    contact_person: z.string().max(191).nullable().optional().or(z.literal("")),
    phone: z.string().min(1, "Phone number is required").max(20),
    email: z.string().email("Invalid email address").max(191).nullable().optional().or(z.literal("")),
    address: z.string().max(500).nullable().optional().or(z.literal("")),
    is_active: z.boolean().default(true),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export function SupplierForm({ onSubmit, onCancel, initialData }: Props) {
    const toast = useToast();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: initialData?.name ?? "",
            contact_person: initialData?.contact_person ?? "",
            phone: initialData?.phone ?? "",
            email: initialData?.email ?? "",
            address: initialData?.address ?? "",
            is_active: initialData?.is_active ?? true,
        },
    });

    const onFormSubmit = async (values: SupplierFormValues) => {
        try {
            await onSubmit({
                name: values.name,
                contact_person: values.contact_person || null,
                phone: values.phone || null,
                email: values.email || null,
                address: values.address || null,
                is_active: values.is_active ?? true,
            });
            toast.success(initialData ? "Supplier updated successfully." : "Supplier created successfully.");
        } catch {
            toast.error(initialData ? "Failed to update supplier." : "Failed to create supplier.");
        }
    };

    const fieldError = (name: keyof SupplierFormValues) => {
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
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-base font-semibold">{initialData ? "Edit Supplier" : "New Supplier"}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Supplier Name *</label>
                    <Input
                        {...register("name")}
                        placeholder="e.g. Pharma Corp Ltd"
                        aria-invalid={!!errors.name}
                    />
                    {fieldError("name")}
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Contact Person</label>
                    <Input
                        {...register("contact_person")}
                        placeholder="e.g. John Doe"
                    />
                    {fieldError("contact_person")}
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Phone *</label>
                    <Input
                        {...register("phone")}
                        placeholder="+95 9 xxx xxxx"
                        aria-invalid={!!errors.phone}
                    />
                    {fieldError("phone")}
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                        type="email"
                        {...register("email")}
                        placeholder="contact@supplier.com"
                    />
                    {fieldError("email")}
                </div>
                <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input
                        {...register("address")}
                        placeholder="123 Main St, Yangon"
                    />
                    {fieldError("address")}
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
