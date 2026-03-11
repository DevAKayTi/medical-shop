import React, { useState, useEffect } from "react";
import { dashboardApi, DailyRevenueDetails, MonthlyRevenueDetails } from "@/lib/dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Receipt, CalendarDays, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ApiSale } from "@/lib/sales";
import { formatCurrency } from "@/lib/currency";

export default function RevenueDetailsPage() {
    const [dailyData, setDailyData] = useState<DailyRevenueDetails | null>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyRevenueDetails | null>(null);
    const [loadingDaily, setLoadingDaily] = useState(true);
    const [loadingMonthly, setLoadingMonthly] = useState(true);

    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

    useEffect(() => {
        setLoadingDaily(true);
        dashboardApi.getRevenueDetails('daily', selectedDate)
            .then(data => setDailyData(data))
            .catch(err => console.error(err))
            .finally(() => setLoadingDaily(false));
    }, [selectedDate]);

    useEffect(() => {
        setLoadingMonthly(true);
        dashboardApi.getRevenueDetails('monthly', selectedMonth)
            .then(data => setMonthlyData(data))
            .catch(err => console.error(err))
            .finally(() => setLoadingMonthly(false));
    }, [selectedMonth]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Revenue Details</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        In-depth view of Daily Sales and Monthly Revenue tracking.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="daily" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="daily">Daily View</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly View</TabsTrigger>
                </TabsList>

                {/* DAILY VIEW TAB */}
                <TabsContent value="daily" className="space-y-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Select Date:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="flex h-9 w-full sm:w-auto rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-slate-800"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Gross Sales</CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                {loadingDaily ? (
                                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                ) : (
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                                        {formatCurrency(dailyData?.gross_sales || 0)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Returns</CardTitle>
                                <Receipt className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                {loadingDaily ? (
                                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                ) : (
                                    <div className="text-2xl font-bold text-red-500 text-opacity-80">
                                        -{formatCurrency(dailyData?.returns || 0)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                                <Receipt className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                {loadingDaily ? (
                                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                ) : (
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(dailyData?.net_revenue || 0)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                                <Receipt className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                {loadingDaily ? (
                                    <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                ) : (
                                    <div className="text-2xl font-bold">{dailyData?.sales?.length || 0}</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Sales Transactions ({selectedDate})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingDaily ? (
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"></div>
                                    ))}
                                </div>
                            ) : dailyData?.sales && dailyData.sales.length > 0 ? (
                                <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Time</th>
                                                <th className="px-4 py-3 font-medium">Invoice</th>
                                                <th className="px-4 py-3 font-medium">Customer</th>
                                                <th className="px-4 py-3 font-medium text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                            {dailyData.sales.map((sale: ApiSale) => {
                                                const isRefund = Number(sale.total) < 0;
                                                return (
                                                    <React.Fragment key={sale.id}>
                                                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-800">
                                                            <td className="px-4 py-3 whitespace-nowrap">{format(new Date(sale.sold_at), 'hh:mm a')}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap font-medium text-blue-600 dark:text-blue-400">
                                                                {sale.invoice_number}
                                                                {isRefund && <span className="ml-2 text-xs text-red-500 font-normal border border-red-200 bg-red-50 dark:bg-red-900/20 px-1 rounded">(Refund)</span>}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">{sale.customer?.name || "Walk-In"}</td>
                                                            <td className={`px-4 py-3 whitespace-nowrap text-right font-medium ${isRefund ? 'text-red-500' : ''}`}>
                                                                {isRefund ? '-' : ''}{formatCurrency(Math.abs(Number(sale.total)))}
                                                            </td>
                                                        </tr>
                                                        {sale.items && sale.items.map((item, idx) => {
                                                            const itemTotal = Number(item.total);
                                                            const isItemRefund = itemTotal < 0;
                                                            return (
                                                                <tr key={`${sale.id}-item-${idx}`} className="text-sm bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                                    <td className="px-4 py-2 border-l-2 border-slate-200 dark:border-slate-800 pl-8" colSpan={2}>
                                                                        {item.product?.name || `Product #${item.product_id?.slice(0, 8)}`}
                                                                        <span className="text-slate-400 ml-2">x {Math.abs(Number(item.quantity))}</span>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-slate-500">
                                                                        @ {formatCurrency(Number(item.unit_price))}
                                                                    </td>
                                                                    <td className={`px-4 py-2 text-right ${isItemRefund ? 'text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                                        {isItemRefund ? '-' : ''}{formatCurrency(Math.abs(itemTotal))}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                    No completed sales found for this date.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* MONTHLY VIEW TAB */}
                <TabsContent value="monthly" className="space-y-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Select Month:</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="flex h-9 w-full sm:w-auto rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-slate-800"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Gross Sales</CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                {loadingMonthly ? (
                                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                ) : (
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                                        {formatCurrency(monthlyData?.gross_sales || 0)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                                <Receipt className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                {loadingMonthly ? (
                                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                ) : (
                                    <div className="text-2xl font-bold text-red-500 text-opacity-80">
                                        -{formatCurrency(monthlyData?.returns || 0)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                                <Receipt className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                {loadingMonthly ? (
                                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                ) : (
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(monthlyData?.net_revenue || 0)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Day by Day Breakdown ({selectedMonth})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingMonthly ? (
                                <div className="space-y-2">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"></div>
                                    ))}
                                </div>
                            ) : monthlyData?.daily_breakdown && monthlyData.daily_breakdown.length > 0 ? (
                                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {monthlyData.daily_breakdown.map((day, idx) => {
                                        const isNegative = Number(day.net_revenue) < 0;
                                        return (
                                            <div key={idx} className="flex flex-col p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays className="h-4 w-4 text-slate-400" />
                                                        <span className="font-medium">{format(new Date(day.date), 'MMM d')}</span>
                                                    </div>
                                                    <span className={`font-bold ${isNegative ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                                                        {isNegative ? '-' : ''}{formatCurrency(Math.abs(Number(day.net_revenue)))}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2 mt-1">
                                                    <span>Gross: {formatCurrency(Number(day.gross_sales))}</span>
                                                    {Number(day.returns) !== 0 && (
                                                        <span className="text-red-400">R: -{formatCurrency(Math.abs(Number(day.returns)))}</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                    No revenue data found for this month.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
