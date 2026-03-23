import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from '@headlessui/react';
import { Input } from "@/components/ui/Input";

export interface PrescriptionDetails {
    customerName: string;
    doctorName: string;
    medicines: string;
    date: string;
}

interface PrescriptionFormProps {
    onSave: (data: PrescriptionDetails) => void;
    onCancel: () => void;
    initialData?: PrescriptionDetails | null;
}

export function PrescriptionForm({ onSave, onCancel, initialData }: PrescriptionFormProps) {
    const [formData, setFormData] = useState<PrescriptionDetails>({
        customerName: initialData?.customerName || "",
        doctorName: initialData?.doctorName || "",
        medicines: initialData?.medicines || "",
        date: initialData?.date || new Date().toISOString().split("T")[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="mb-4 text-sm font-medium text-slate-900 dark:text-slate-50">Prescription Details</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium">Patient / Customer Name *</label>
                    <Input
                        name="customerName"
                        required
                        value={formData.customerName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="h-8 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium">Doctor Name</label>
                    <Input
                        name="doctorName"
                        value={formData.doctorName}
                        onChange={handleChange}
                        placeholder="Dr. Smith"
                        className="h-8 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium">Prescribed Medicines</label>
                    <Textarea
                        name="medicines"
                        value={formData.medicines}
                        onChange={handleChange}
                        className="flex min-h-[60px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-emerald-500 dark:focus:ring-offset-slate-900"
                        placeholder="List of medicines..."
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium">Prescription Date *</label>
                    <Input
                        name="date"
                        type="date"
                        required
                        value={formData.date}
                        onChange={handleChange}
                        className="h-8 text-sm"
                    />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" size="sm">Attach to Sale</Button>
                </div>
            </form>
        </div>
    );
}
