import { useMemo } from "react";
import { Product, Sale, storageLib } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Receipt, PackageSearch, AlertTriangle } from "lucide-react";

export default function DashboardIndex() {
    const user = storageLib.getAuthUser();
    const sales = useMemo(() => storageLib.getItem<Sale[]>("sales") || [], []);
    const products = useMemo(() => storageLib.getItem<Product[]>("products") || [], []);

    // Compute basic stats
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const lowStockProducts = products.filter(p => p.quantity < 10).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Welcome back, {user?.name}. Here's an overview of your medical shop.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <Receipt className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">+20.1% from last month (Demo)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Sales</CardTitle>
                        <Receipt className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{sales.length}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total transactions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                        <PackageSearch className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{products.length}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">In catalog</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-500">Low Stock</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{lowStockProducts}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Items needing reorder</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
