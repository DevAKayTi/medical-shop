import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/currency";
import { ApiCustomer, customerApi, CreateCustomerPayload, saleApi, ApiSale } from "@/lib/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    Search, Plus, Edit, Trash2, History, ChevronLeft, RefreshCw,
    Users, Star, TrendingUp, ShoppingBag
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

// ─── Customer Form ────────────────────────────────────────────────────────────

function CustomerForm({
    initial,
    onSave,
    onCancel,
}: {
    initial?: ApiCustomer;
    onSave: (data: CreateCustomerPayload) => Promise<void>;
    onCancel: () => void;
}) {
    const [form, setForm] = useState<CreateCustomerPayload>({
        name: initial?.name ?? "",
        phone: initial?.phone ?? "",
        email: initial?.email ?? "",
        date_of_birth: initial?.date_of_birth ?? "",
        gender: (initial?.gender as any) ?? "",
        address: initial?.address ?? "",
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) newErrors.name = "Name is required.";
        if (!form.phone?.trim()) newErrors.phone = "Phone number is required.";

        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Invalid email format.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSaving(true);
        try {
            await onSave(form);
        } catch (err: any) {
            if (err.response?.data?.errors) {
                const apiErrors: Record<string, string> = {};
                Object.entries(err.response.data.errors).forEach(([key, msgs]: [string, any]) => {
                    apiErrors[key] = Array.isArray(msgs) ? msgs[0] : msgs;
                });
                setErrors(apiErrors);
            } else {
                setErrors({ submit: err.response?.data?.message || "Failed to save customer." });
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="animate-in slide-in-from-top-4 duration-300">
            <CardHeader>
                <CardTitle>{initial ? "Edit Customer" : "Add New Customer"}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name *</label>
                        <Input
                            value={form.name}
                            onChange={e => set("name", e.target.value)}
                            placeholder="Patient / Customer Name"
                            className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone *</label>
                        <Input
                            value={form.phone ?? ""}
                            onChange={e => set("phone", e.target.value)}
                            placeholder="+95 9..."
                            className={`mt-1 ${errors.phone ? 'border-red-500' : ''}`}
                            required
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                        <Input
                            type="email"
                            value={form.email ?? ""}
                            onChange={e => set("email", e.target.value)}
                            placeholder="customer@email.com"
                            className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                        <Input
                            type="date"
                            value={form.date_of_birth ?? ""}
                            onChange={e => set("date_of_birth", e.target.value)}
                            className={`mt-1 ${errors.date_of_birth ? 'border-red-500' : ''}`}
                        />
                        {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Gender</label>
                        <select
                            value={form.gender ?? ""}
                            onChange={e => set("gender", e.target.value)}
                            className={`mt-1 w-full h-10 rounded-md border ${errors.gender ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                            <option value="">Not specified</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                        {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                        <textarea
                            value={form.address ?? ""}
                            onChange={e => set("address", e.target.value)}
                            rows={2}
                            placeholder="Street, city..."
                            className={`mt-1 w-full rounded-md border ${errors.address ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                    </div>
                    {errors.submit && (
                        <div className="md:col-span-2 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                            {errors.submit}
                        </div>
                    )}
                    <div className="md:col-span-2 flex gap-3 pt-2">
                        <Button type="submit" disabled={saving}>{saving ? "Saving…" : initial ? "Update Customer" : "Add Customer"}</Button>
                        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
    const [customers, setCustomers] = useState<ApiCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<ApiCustomer | undefined>(undefined);
    const [viewingCustomer, setViewingCustomer] = useState<ApiCustomer | null>(null);
    const [customerSales, setCustomerSales] = useState<ApiSale[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const toast = useToast();

    useEffect(() => { loadCustomers(); }, []);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const resp = await customerApi.list();
            setCustomers(resp.data || []);
        } catch {
            toast.error("Failed to load customers.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: CreateCustomerPayload) => {
        if (editingCustomer) {
            await customerApi.update(editingCustomer.id, data);
            toast.success("Customer updated! ✅");
        } else {
            await customerApi.create(data);
            toast.success("Customer added! 🎉");
        }
        setIsFormOpen(false);
        setEditingCustomer(undefined);
        await loadCustomers();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this customer? Their sales history will be preserved.")) return;
        try {
            await customerApi.delete(id);
            toast.success("Customer deleted.");
            setCustomers(cs => cs.filter(c => c.id !== id));
            if (viewingCustomer?.id === id) setViewingCustomer(null);
        } catch {
            toast.error("Could not delete customer.");
        }
    };

    const openHistory = async (customer: ApiCustomer) => {
        setViewingCustomer(customer);
        setLoadingHistory(true);
        try {
            const resp = await saleApi.list({ customer_id: customer.id });
            setCustomerSales(resp.data || []);
        } catch {
            setCustomerSales([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const filtered = customers.filter(c => {
        const s = search.toLowerCase();
        return (c.name.toLowerCase().includes(s) ||
            (c.phone || "").toLowerCase().includes(s) ||
            (c.email || "").toLowerCase().includes(s));
    });

    const totalLoyaltyPts = customers.reduce((s, c) => s + (c.loyalty_points || 0), 0);
    const totalSpent = customers.reduce((s, c) => s + Number(c.total_spent || 0), 0);

    // ─── History View ─────────────────────────────────────────────────
    if (viewingCustomer) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                    <button onClick={() => setViewingCustomer(null)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                        <ChevronLeft className="h-4 w-4" /> Back to Customers
                    </button>
                </div>
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{viewingCustomer.name}</h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            {viewingCustomer.phone && <span>{viewingCustomer.phone} &middot; </span>}
                            <span className="text-amber-600 font-medium">{viewingCustomer.loyalty_points} pts</span>
                            <span className="mx-1.5">·</span>
                            Total spent: <span className="font-medium text-emerald-600">{Number(viewingCustomer.total_spent).toFixed(2)}</span>
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setEditingCustomer(viewingCustomer); setIsFormOpen(true); setViewingCustomer(null); }}>
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                </div>
                <Card>
                    <CardHeader><CardTitle className="text-base">Purchase History ({customerSales.length})</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        {loadingHistory ? (
                            <p className="py-10 text-center text-slate-400">Loading history…</p>
                        ) : customerSales.length === 0 ? (
                            <p className="py-10 text-center text-slate-400">No purchases recorded for this customer.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-5 py-3">Invoice</th>
                                            <th className="px-5 py-3">Date</th>
                                            <th className="px-5 py-3">Status</th>
                                            <th className="px-5 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {customerSales.map(s => (
                                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                                <td className="px-5 py-3 font-mono text-xs text-blue-600">{s.invoice_number}</td>
                                                <td className="px-5 py-3 text-slate-500 text-xs">{new Date(s.sold_at).toLocaleDateString()}</td>
                                                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span></td>
                                                <td className="px-5 py-3 text-right font-semibold">{Number(s.total).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ─── List View ────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Customers</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your customer directory and purchase history.</p>
                </div>
                {!isFormOpen && (
                    <Button onClick={() => { setEditingCustomer(undefined); setIsFormOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Customer
                    </Button>
                )}
            </div>

            {/* Stats */}
            {!isFormOpen && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: Users, label: "Total Customers", val: customers.length, color: "blue" },
                        { icon: Star, label: "Total Loyalty Pts", val: totalLoyaltyPts.toLocaleString(), color: "amber" },
                        { icon: TrendingUp, label: "Total Revenue", val: totalSpent.toFixed(0), color: "emerald" },
                        { icon: ShoppingBag, label: "With Purchases", val: customers.filter(c => (c.sales_count || 0) > 0).length, color: "purple" },
                    ].map(({ icon: Icon, label, val, color }) => (
                        <Card key={label}>
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
                                        <Icon className={`h-5 w-5 text-${color}-600`} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">{label}</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{val}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Form */}
            {isFormOpen && (
                <CustomerForm
                    initial={editingCustomer}
                    onSave={handleSave}
                    onCancel={() => { setIsFormOpen(false); setEditingCustomer(undefined); }}
                />
            )}

            {/* Table */}
            {!isFormOpen && (
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4">
                        <CardTitle className="text-lg">Customer Directory ({filtered.length})</CardTitle>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <Input placeholder="Search name, phone, email…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-64" />
                            </div>
                            <Button variant="outline" onClick={loadCustomers} title="Refresh"><RefreshCw className="h-4 w-4" /></Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="py-16 text-center text-slate-400">Loading customers…</div>
                        ) : filtered.length === 0 ? (
                            <div className="py-16 text-center">
                                <Users className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                                <p className="text-slate-500">No customers found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-5 py-3">Name</th>
                                            <th className="px-5 py-3">Phone / Email</th>
                                            <th className="px-5 py-3">Loyalty Pts</th>
                                            <th className="px-5 py-3 text-right text-xs">TOTAL SPENT (MMR)</th>
                                            <th className="px-5 py-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {filtered.map(customer => (
                                            <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="font-medium text-slate-900 dark:text-white">{customer.name}</div>
                                                    {customer.gender && <div className="text-xs text-slate-400 capitalize">{customer.gender}</div>}
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-500">
                                                    <div>{customer.phone || "—"}</div>
                                                    {customer.email && <div className="text-xs">{customer.email}</div>}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                        <Star className="h-2.5 w-2.5" /> {customer.loyalty_points} pts
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">{Number(customer.total_spent).toFixed(2)}</td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex justify-center gap-1">
                                                        <Button variant="ghost" size="icon" title="Purchase History" onClick={() => openHistory(customer)}>
                                                            <History className="h-4 w-4 text-emerald-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => { setEditingCustomer(customer); setIsFormOpen(true); }}>
                                                            <Edit className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
