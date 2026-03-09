import { useState, useEffect } from "react";
import { Customer, Sale, storageLib } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomerForm } from "@/components/CustomerForm";
import { Search, Plus, Edit, Trash2, History } from "lucide-react";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
    const [viewingHistory, setViewingHistory] = useState<Customer | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const custData = storageLib.getItem<Customer[]>("customers") || [];
        const salesData = storageLib.getItem<Sale[]>("sales") || [];
        setCustomers(custData);
        setSales(salesData);
    };

    const handleSaveCustomer = (customerData: Omit<Customer, "id">) => {
        let updatedCustomers = [...customers];

        if (editingCustomer) {
            updatedCustomers = updatedCustomers.map(c =>
                c.id === editingCustomer.id ? { ...customerData, id: c.id } : c
            );
        } else {
            const newCustomer: Customer = {
                ...customerData,
                id: `cust-${Date.now()}`
            };
            updatedCustomers.push(newCustomer);
        }

        storageLib.setItem("customers", updatedCustomers);
        setCustomers(updatedCustomers);
        setIsFormOpen(false);
        setEditingCustomer(undefined);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this customer?")) {
            const updatedCustomers = customers.filter(c => c.id !== id);
            storageLib.setItem("customers", updatedCustomers);
            setCustomers(updatedCustomers);
            if (viewingHistory?.id === id) setViewingHistory(null);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getCustomerSales = (customerId: string) => {
        return sales.filter(s => s.customerId === customerId);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Customers</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage your customer directory and view purchase history.
                    </p>
                </div>
                {!isFormOpen && (
                    <Button onClick={() => { setEditingCustomer(undefined); setIsFormOpen(true); }} className="flex-shrink-0">
                        <Plus className="mr-2 h-4 w-4" /> Add Customer
                    </Button>
                )}
            </div>

            {isFormOpen ? (
                <CustomerForm
                    initialData={editingCustomer}
                    onSubmit={handleSaveCustomer}
                    onCancel={() => { setIsFormOpen(false); setEditingCustomer(undefined); }}
                />
            ) : viewingHistory ? (
                <Card className="animate-in fade-in slide-in-from-bottom-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b dark:border-slate-800">
                        <div>
                            <CardTitle className="text-xl font-semibold">Purchase History: {viewingHistory.name}</CardTitle>
                            <p className="text-sm text-slate-500 mt-1">{viewingHistory.phone} • {viewingHistory.loyaltyPoints} Loyalty Points</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setViewingHistory(null)}>
                            Back to Directory
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {getCustomerSales(viewingHistory.id).length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No purchase history found for this customer.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-slate-50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Date</th>
                                            <th className="px-4 py-3 font-medium">Transaction ID</th>
                                            <th className="px-4 py-3 font-medium text-right">Total Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {getCustomerSales(viewingHistory.id).map((sale) => (
                                            <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                <td className="px-4 py-3">{new Date(sale.timestamp).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-slate-500">{sale.id}</td>
                                                <td className="px-4 py-3 text-right font-medium">${sale.total.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
                        <CardTitle className="text-xl font-semibold">Customer Directory</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                type="search"
                                placeholder="Search by name or phone..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <p className="text-slate-500 dark:text-slate-400 mb-4">No customers found.</p>
                                {customers.length === 0 && (
                                    <Button variant="outline" onClick={() => setIsFormOpen(true)}>Add your first customer</Button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-slate-50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Name</th>
                                            <th className="px-4 py-3 font-medium">Phone</th>
                                            <th className="px-4 py-3 font-medium">Loyalty Points</th>
                                            <th className="px-4 py-3 font-medium text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {filteredCustomers.map((customer) => (
                                            <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{customer.name}</td>
                                                <td className="px-4 py-3 text-slate-500">{customer.phone}</td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                        {customer.loyaltyPoints} pts
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex justify-center flex-nowrap space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Purchase History"
                                                            onClick={() => setViewingHistory(customer)}
                                                        >
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
