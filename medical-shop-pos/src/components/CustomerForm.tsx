import { useState, useEffect } from "react";
import { Customer } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CustomerFormProps {
    initialData?: Customer;
    onSubmit: (customer: Omit<Customer, "id">) => void;
    onCancel: () => void;
}

export function CustomerForm({ initialData, onSubmit, onCancel }: CustomerFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "",
        loyaltyPoints: "0",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                phone: initialData.phone,
                address: initialData.address,
                loyaltyPoints: initialData.loyaltyPoints.toString(),
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            loyaltyPoints: parseInt(formData.loyaltyPoints) || 0,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">
                {initialData ? "Edit Customer" : "Add New Customer"}
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Customer Name *</label>
                    <Input name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. John Doe" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number *</label>
                    <Input name="phone" required value={formData.phone} onChange={handleChange} placeholder="e.g. +1 234 567 8900" />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Address</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
                        placeholder="e.g. 123 Main St, City, Country"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Loyalty Points manually adjust</label>
                    <Input name="loyaltyPoints" type="number" min="0" required value={formData.loyaltyPoints} onChange={handleChange} />
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{initialData ? "Save Changes" : "Add Customer"}</Button>
            </div>
        </form>
    );
}
