import { useState, useEffect, useMemo } from "react";
import { Sale, Product, storageLib } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SalesReport } from "@/components/SalesReport";
import { InventoryAlert } from "@/components/InventoryAlert";
import { BarChart3, TrendingUp, PackageSearch } from "lucide-react";

export default function ReportsPage() {
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Reports & Analytics</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    View revenue charts, top performing products, and inventory health.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">${totalRevenue.toFixed(2)}</div>
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
                        <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">${totalTax.toFixed(2)}</div>
                        <p className="text-xs text-slate-500 mt-1">Lifetime tax collected</p>
                    </CardContent>
                </Card>
            </div>

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
                                            ${p.revenue.toFixed(2)}
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
    );
}
