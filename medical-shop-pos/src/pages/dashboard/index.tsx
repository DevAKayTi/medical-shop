import { useState, useEffect, useMemo } from "react";
import { Sale, Product, storageLib } from "@/lib/storage";
import { dashboardApi, DashboardStats } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BarChart3, TrendingUp, Receipt, PackageSearch, AlertTriangle } from "lucide-react";
import { SalesReport } from "@/components/SalesReport";
import { InventoryAlert } from "@/components/InventoryAlert";

export default function DashboardIndex() {
    const user = storageLib.getAuthUser();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [period, setPeriod] = useState<"daily" | "monthly">("daily");


    useEffect(() => {
        setSales(storageLib.getItem<Sale[]>("sales") || []);
        setProducts(storageLib.getItem<Product[]>("products") || []);
    }, []);

    const totalRevenue = useMemo(() => sales.reduce((sum, s) => sum + s.total, 0), [sales]);
    const totalTax = useMemo(() => sales.reduce((sum, s) => sum + s.tax, 0), [sales]);
    const transactionCount = sales.length;

    const topProducts = useMemo(() => {
        const productSales: Record<string, { name: string, quantity: number, revenue: number }> = {};

        // Map product names
        const productNames = products.reduce((acc, p) => {
            acc[p.id] = p.name;
            return acc;
        }, {} as Record<string, string>);

        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        name: productNames[item.productId] || "Unknown Product",
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.productId].quantity += item.quantity;
                // Calculate revenue accounting for discounts effectively applied
                const itemRevenue = (item.price * item.quantity) - item.discount;
                productSales[item.productId].revenue += itemRevenue;
            });
        });

        return Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5); // Top 5
    }, [sales, products]);


    useEffect(() => {
        dashboardApi.getStats()
            .then(data => setStats(data))
            .catch(err => console.error("Failed to load dashboard stats", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-50">
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

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</div>
                                <p className="text-xs text-slate-500 mt-1">Lifetime generated revenue</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                                <BarChart3 className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{transactionCount}</div>
                                <p className="text-xs text-slate-500 mt-1">Total completed sales</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
                                <TrendingUp className="h-4 w-4 text-slate-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{formatCurrency(totalTax)}</div>
                                <p className="text-xs text-slate-500 mt-1">Lifetime tax collected</p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-6 animate-in fade-in duration-500 mt-6">

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="md:col-span-4 lg:col-span-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Sales Revenue</CardTitle>
                                <p className="text-sm text-slate-500 mt-1">Analytics for your shop revenue</p>
                            </div>
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value as "daily" | "monthly")}
                                className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                            >
                                <option value="daily">Daily</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </CardHeader>
                        <CardContent>
                            <SalesReport sales={sales} period={period} />
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-3 lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <PackageSearch className="mr-2 h-5 w-5 text-indigo-500" />
                                Top Products Sold
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topProducts.length === 0 ? (
                                <p className="text-slate-500 text-sm">No sales data to determine top products.</p>
                            ) : (
                                <div className="space-y-4">
                                    {topProducts.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">{p.name}</p>
                                                <p className="text-xs text-slate-500">{p.quantity} units sold</p>
                                            </div>
                                            <div className="font-medium text-sm">
                                                {formatCurrency(p.revenue)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-xl font-bold mb-4 tracking-tight text-slate-900 dark:text-slate-50">Inventory Health Check</h3>
                    {/* Reuse the InventoryAlert component we smartly built in Phase 2 */}
                    <InventoryAlert products={products} />
                </div>

            </div>
        </div>
    );
}