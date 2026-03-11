import { useState, useEffect } from "react";
import { storageLib } from "@/lib/storage";
import { dashboardApi, DashboardStats } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Receipt, PackageSearch, AlertTriangle } from "lucide-react";

export default function DashboardIndex() {
    const user = storageLib.getAuthUser();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dashboardApi.getStats()
            .then(data => setStats(data))
            .catch(err => console.error("Failed to load dashboard stats", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Welcome back, {user?.name}. Here's an overview of your medical shop.
                </p>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                                <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Revenue Row */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                            <Receipt className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats?.revenue?.daily?.current || 0)}</div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {Number(stats?.revenue?.daily?.growth || 0) >= 0 ? "+" : ""}{stats?.revenue?.daily?.growth || 0}% from yesterday
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">This Month's Revenue</CardTitle>
                            <Receipt className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats?.revenue?.monthly?.current || 0)}</div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {Number(stats?.revenue?.monthly?.growth || 0) >= 0 ? "+" : ""}{stats?.revenue?.monthly?.growth || 0}% from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">This Year's Revenue</CardTitle>
                            <Receipt className="h-4 w-4 text-emerald-700" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats?.revenue?.yearly?.current || 0)}</div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {Number(stats?.revenue?.yearly?.growth || 0) >= 0 ? "+" : ""}{stats?.revenue?.yearly?.growth || 0}% from last year
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Sales</CardTitle>
                            <Receipt className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{stats?.sales_count || 0}</div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total transactions this month</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                            <PackageSearch className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.products?.active || 0}</div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">In catalog</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-500">Low Stock</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{stats?.products?.low_stock || 0}</div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Items needing reorder</p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
