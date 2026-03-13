import { useState, useEffect } from "react";
import { dashboardApi, DailyRevenueDetails, MonthlyRevenueDetails } from "@/lib/dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Receipt, CalendarDays, TrendingUp, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { ApiSale } from "@/lib/sales";
import { formatCurrency } from "@/lib/currency";

export default function RevenueDetailsPage() {
    const [dailyData, setDailyData] = useState<DailyRevenueDetails | null>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyRevenueDetails | null>(null);
    const [loadingDaily, setLoadingDaily] = useState(true);
    const [loadingMonthly, setLoadingMonthly] = useState(true);

    const [selectedSale, setSelectedSale] = useState<ApiSale | null>(null);
    const [showDetails, setShowDetails] = useState(false);

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
                                                    <tr
                                                        key={sale.id}
                                                        onClick={() => { setSelectedSale(sale); setShowDetails(true); }}
                                                        className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 border-t-2 border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
                                                    >
                                                        <td className="px-4 py-3 whitespace-nowrap">{format(new Date(sale.sold_at || sale.created_at), 'hh:mm a')}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap font-medium text-blue-600 dark:text-blue-400">
                                                            {sale.invoice_number}
                                                            {isRefund && <span className="ml-2 text-xs text-red-500 font-normal border border-red-200 bg-red-50 dark:bg-red-900/20 px-1 rounded">(Refund)</span>}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">{sale.customer?.name || "Walk-In"}</td>
                                                        <td className={`px-4 py-3 whitespace-nowrap text-right font-medium ${isRefund ? 'text-red-500' : ''}`}>
                                                            {isRefund ? '-' : ''}{formatCurrency(Math.abs(Number(sale.total)))}
                                                        </td>
                                                    </tr>
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

            {/* View Details Modal for Daily View */}
            {showDetails && selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
                        <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-blue-500" />
                                    Invoice {selectedSale.invoice_number}
                                </CardTitle>
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-4">
                                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(new Date(selectedSale.sold_at || selectedSale.created_at), 'PPp')}</span>
                                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {selectedSale.cashier?.name || 'Unknown'}</span>
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowDetails(false)}>
                                <span className="sr-only">Close</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-5 w-5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </Button>
                        </CardHeader>

                        <CardContent className="overflow-y-auto p-6 space-y-6">
                            <div className="flex justify-between items-start bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Customer Details</h4>
                                    {selectedSale.customer ? (
                                        <>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{selectedSale.customer.name}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{selectedSale.customer.phone || 'No phone'}</p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">Walk-in Customer</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Status</h4>
                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                                        {selectedSale.status}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 border-b pb-2 dark:border-slate-800">Order Items</h3>
                                <table className="w-full text-sm">
                                    <thead className="text-slate-500 dark:text-slate-400 border-b dark:border-slate-800 text-left">
                                        <tr>
                                            <th className="font-medium py-2">Item</th>
                                            <th className="font-medium py-2 text-right">Qty</th>
                                            <th className="font-medium py-2 text-right">Price</th>
                                            <th className="font-medium py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {selectedSale.items?.map((item: any, i: number) => (
                                            <tr key={i}>
                                                <td className="py-2.5">
                                                    <p className="font-medium text-slate-900 dark:text-slate-100">{item.product?.name || "Unknown Product"}</p>
                                                    {item.batch && <p className="text-xs text-slate-500">Batch: {item.batch.batch_number}</p>}
                                                </td>
                                                <td className="py-2.5 text-right">{Math.abs(Number(item.quantity))}</td>
                                                <td className="py-2.5 text-right">{formatCurrency(Number(item.unit_price))}</td>
                                                <td className="py-2.5 text-right font-medium">{formatCurrency(Math.abs(Number(item.total)))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t-2 dark:border-slate-800">
                                        <tr>
                                            <th colSpan={3} className="py-2 text-right text-slate-500 font-normal">Subtotal</th>
                                            <td className="py-2 text-right">{formatCurrency(Math.abs(Number(selectedSale.subtotal)))}</td>
                                        </tr>
                                        {Number(selectedSale.discount) > 0 && (
                                            <tr>
                                                <th colSpan={3} className="py-1 text-right text-slate-500 font-normal">Discount</th>
                                                <td className="py-1 text-right text-red-500">-{formatCurrency(Number(selectedSale.discount))}</td>
                                            </tr>
                                        )}
                                        {Number(selectedSale.tax) > 0 && (
                                            <tr>
                                                <th colSpan={3} className="py-1 text-right text-slate-500 font-normal">Tax</th>
                                                <td className="py-1 text-right">{formatCurrency(Number(selectedSale.tax))}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <th colSpan={3} className="py-3 text-right font-bold text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wider">Total</th>
                                            <td className="py-3 text-right font-bold text-lg text-slate-900 dark:text-slate-100">
                                                {Number(selectedSale.total) < 0 ? '-' : ''}{formatCurrency(Math.abs(Number(selectedSale.total)))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
