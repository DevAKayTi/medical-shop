import { useState, useEffect } from "react";
import { registerApi, ApiCashRegister, CreateCashRegisterPayload } from "@/lib/registers";
import { Plus, Edit, Trash2, PowerOff, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/ToastProvider";

const registerSchema = z.object({
    name: z.string().min(1, "Register name is required."),
    is_active: z.boolean().default(true),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Form Component ────────────────────────────────────────────────────────
function RegisterForm({
    initial,
    onSave,
    onCancel,
}: {
    initial?: ApiCashRegister;
    onSave: (data: CreateCashRegisterPayload) => Promise<void>;
    onCancel: () => void;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema) as any,
        defaultValues: {
            name: initial?.name ?? "",
            is_active: initial?.is_active ?? true,
        },
    });

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            await onSave(data);
        } catch (err: any) {
            setError("root", {
                type: "manual",
                message: err.response?.data?.message || "Failed to save register.",
            });
        }
    };

    return (
        <Card className="animate-in slide-in-from-top-4 duration-300 mb-6">
            <CardHeader>
                <CardTitle>{initial ? "Edit Cash Register" : "Add Cash Register"}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                        <Input
                            {...register("name")}
                            placeholder="e.g., Main Register 1"
                            className={`mt-1 max-w-sm ${errors.name ? 'border-red-500' : ''}`}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            {...register("is_active")}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-900"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Active
                        </label>
                    </div>

                    {errors.root && <p className="text-red-500 text-sm mt-1">{errors.root.message}</p>}

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save Register"}</Button>
                        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

// ─── Main Page Component ───────────────────────────────────────────────────
export default function RegistersPage() {
    const [registers, setRegisters] = useState<ApiCashRegister[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRegister, setEditingRegister] = useState<ApiCashRegister | undefined>(undefined);
    const toast = useToast();

    useEffect(() => {
        loadRegisters();
    }, []);

    const loadRegisters = async () => {
        setLoading(true);
        try {
            const data = await registerApi.list();
            setRegisters(data);
        } catch {
            toast.error("Failed to load cash registers.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: CreateCashRegisterPayload) => {
        if (editingRegister) {
            await registerApi.update(editingRegister.id, data);
            toast.success("Register updated successfully.");
        } else {
            await registerApi.create(data);
            toast.success("Register added successfully.");
        }
        setIsFormOpen(false);
        setEditingRegister(undefined);
        await loadRegisters();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this cash register? This cannot be undone.")) return;
        try {
            await registerApi.delete(id);
            toast.success("Register deleted.");
            await loadRegisters();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete register.");
        }
    };

    const toggleStatus = async (register: ApiCashRegister) => {
        try {
            await registerApi.update(register.id, { name: register.name, is_active: !register.is_active });
            toast.success(`Register ${!register.is_active ? 'activated' : 'deactivated'}.`);
            await loadRegisters();
        } catch (err: any) {
            toast.error("Failed to update status.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Cash Registers</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage POS cash registers and their statuses.</p>
                </div>
                {!isFormOpen && (
                    <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Add Register
                    </Button>
                )}
            </div>

            {isFormOpen && (
                <RegisterForm
                    initial={editingRegister}
                    onSave={handleSave}
                    onCancel={() => { setIsFormOpen(false); setEditingRegister(undefined); }}
                />
            )}

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Register Name</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-blue-600"></div>
                                            Loading registers...
                                        </div>
                                    </td>
                                </tr>
                            ) : registers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                                        No cash registers found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                registers.map(reg => (
                                    <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                                            {reg.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${reg.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                {reg.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => toggleStatus(reg)}
                                                    className={`p-2 rounded-md border ${reg.is_active ? 'text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-900/50 dark:hover:bg-amber-900/20' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-900/20'} transition-colors`}
                                                    title={reg.is_active ? "Deactivate Register" : "Activate Register"}
                                                >
                                                    {reg.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    onClick={() => { setEditingRegister(reg); setIsFormOpen(true); }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                    title="Edit Register"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(reg.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                    title="Delete Register"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
