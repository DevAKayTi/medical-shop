import { useState, useEffect } from "react";
import { dashboardApi, DailyRevenueDetails, MonthlyRevenueDetails } from "@/lib/dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Receipt, CalendarDays, TrendingUp, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { ApiSale } from "@/lib/sales";
import { formatNumber } from "@/lib/currency";

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

    const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");

    const tabs = [
        { id: "daily", name: "Daily View", icon: Calendar },
        { id: "monthly", name: "Monthly View", icon: CalendarDays },
    ];

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

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as "daily" | "monthly")}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all rounded-md flex-shrink-0 ${activeTab === tab.id
                            ? "bg-emerald-600 text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.name}</span>
                    </button>
                ))}
            </div>

            <div className="mt-4">
                {activeTab === "daily" ? (
                    /* DAILY VIEW TAB */
                    <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Select Date:</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="flex h-9 w-full sm:w-auto rounded-md border border-emerald-500/50 bg-white dark:bg-slate-950 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 dark:border-emerald-500/20"
                            />
                        </div>

                        <dl className="mt-5 grid grid-cols-1 divide-slate-200 overflow-hidden rounded-lg bg-white shadow-sm md:grid-cols-4 md:divide-x md:divide-y-0 dark:divide-white/10 dark:bg-slate-800/75 dark:shadow-none dark:ring-1 dark:ring-white/10">
                            {[
                                { name: 'Gross Sales', stat: formatNumber(dailyData?.gross_sales || 0), loading: loadingDaily, labelColor: 'text-emerald-600 dark:text-emerald-400', valueColor: 'text-slate-800 dark:text-slate-200' },
                                { name: 'Returns', stat: `-${formatNumber(dailyData?.returns || 0)}`, loading: loadingDaily, labelColor: 'text-red-600 dark:text-red-400', valueColor: 'text-slate-800 dark:text-slate-200' },
                                {
                                    name: 'Net Revenue',
                                    stat: `${Number(dailyData?.net_revenue || 0) < 0 ? '-' : ''}${formatNumber(Math.abs(Number(dailyData?.net_revenue || 0)))}`,
                                    loading: loadingDaily,
                                    labelColor: 'text-slate-500 dark:text-slate-400',
                                    valueColor: Number(dailyData?.net_revenue || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                },
                                { name: 'Transactions', stat: (dailyData?.sales?.length || 0).toString(), loading: loadingDaily, labelColor: 'text-slate-500 dark:text-slate-400', valueColor: 'text-slate-800 dark:text-slate-200' },
                            ].map((item) => (
                                <div key={item.name} className="px-4 py-5 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                    <dt className={`text-sm font-medium ${item.labelColor}`}>{item.name}</dt>
                                    <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                                        <div className={`flex items-baseline text-2xl font-semibold ${item.valueColor}`}>
                                            {item.loading ? (
                                                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                            ) : (
                                                item.stat
                                            )}
                                        </div>
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        <Card>
                            <CardHeader className="border-b dark:border-slate-800">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-500" />
                                    Sales Transactions ({selectedDate})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {loadingDaily ? (
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"></div>
                                        ))}
                                    </div>
                                ) : dailyData?.sales && dailyData.sales.length > 0 ? (
                                    <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">Time</th>
                                                    <th className="px-4 py-3">Invoice</th>
                                                    <th className="px-4 py-3">Customer</th>
                                                    <th className="px-4 py-3 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                                {dailyData.sales.map((sale: ApiSale) => {
                                                    const isRefund = Number(sale.total) < 0;
                                                    return (
                                                        <tr
                                                            key={sale.id}
                                                            onClick={() => { setSelectedSale(sale); setShowDetails(true); }}
                                                            className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                                                        >
                                                            <td className="px-4 py-3 whitespace-nowrap text-slate-500">{format(new Date(sale.sold_at || sale.created_at), 'hh:mm a')}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap font-medium text-blue-600 dark:text-blue-400">
                                                                {sale.invoice_number}
                                                                {isRefund && <span className="ml-2 text-[10px] uppercase font-bold text-red-500 border border-red-200 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded tracking-tighter">Refund</span>}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">{sale.customer?.name || "Walk-In"}</td>
                                                            <td className={`px-4 py-3 whitespace-nowrap text-right font-bold ${isRefund ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>
                                                                {isRefund ? '-' : ''}{formatNumber(Math.abs(Number(sale.total)))}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/20 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                        No completed sales found for this date.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    /* MONTHLY VIEW TAB */
                    <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Select Month:</label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(e.target.value)}
                                className="flex h-9 w-full sm:w-auto rounded-md border border-emerald-500/50 bg-white dark:bg-slate-950 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 dark:border-emerald-500/20"
                            />
                        </div>

                        <dl className="mt-5 grid grid-cols-1 divide-slate-200 overflow-hidden rounded-lg bg-white shadow-sm md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-white/10 dark:bg-slate-800/75 dark:shadow-none dark:ring-1 dark:ring-white/10">
                            {[
                                { name: 'Gross Sales', stat: formatNumber(monthlyData?.gross_sales || 0), loading: loadingMonthly, labelColor: 'text-emerald-600 dark:text-emerald-400', valueColor: 'text-slate-800 dark:text-slate-200' },
                                { name: 'Total Returns', stat: `-${formatNumber(monthlyData?.returns || 0)}`, loading: loadingMonthly, labelColor: 'text-red-600 dark:text-red-400', valueColor: 'text-slate-800 dark:text-slate-200' },
                                {
                                    name: 'Net Revenue',
                                    stat: `${Number(monthlyData?.net_revenue || 0) < 0 ? '-' : ''}${formatNumber(Math.abs(Number(monthlyData?.net_revenue || 0)))}`,
                                    loading: loadingMonthly,
                                    labelColor: 'text-slate-500 dark:text-slate-400',
                                    valueColor: Number(monthlyData?.net_revenue || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                },
                            ].map((item) => (
                                <div key={item.name} className="px-4 py-5 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                    <dt className={`text-sm font-medium ${item.labelColor}`}>{item.name}</dt>
                                    <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                                        <div className={`flex items-baseline text-2xl font-semibold ${item.valueColor}`}>
                                            {item.loading ? (
                                                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                            ) : (
                                                item.stat
                                            )}
                                        </div>
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        <Card>
                            <CardHeader className="border-b dark:border-slate-800">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-blue-500" />
                                    Day by Day Breakdown ({selectedMonth})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
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
                                                <div key={idx} className="flex flex-col p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex items-center justify-between mb-3 border-b dark:border-slate-800 pb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-tighter text-slate-500">
                                                                {format(new Date(day.date), 'EEE')}
                                                            </div>
                                                            <span className="font-bold text-slate-700 dark:text-slate-200">{format(new Date(day.date), 'MMM d')}</span>
                                                        </div>
                                                        <span className={`font-bold text-sm ${isNegative ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                                                            {isNegative ? '-' : ''}{formatNumber(Math.abs(Number(day.net_revenue)))}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between text-[11px] text-slate-500">
                                                            <span>Gross Sales:</span>
                                                            <span className="font-medium text-slate-700 dark:text-slate-300">{formatNumber(Number(day.gross_sales))}</span>
                                                        </div>
                                                        {Number(day.returns) !== 0 && (
                                                            <div className="flex justify-between text-[11px] text-red-500">
                                                                <span>Returns:</span>
                                                                <span className="font-medium">-{formatNumber(Math.abs(Number(day.returns)))}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/20 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                        No revenue data found for this month.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

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
                                                <td className="py-2.5 text-right">{formatNumber(Number(item.unit_price))}</td>
                                                <td className="py-2.5 text-right font-medium">{formatNumber(Math.abs(Number(item.total)))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t-2 dark:border-slate-800">
                                        <tr>
                                            <th colSpan={3} className="py-2 text-right text-slate-500 font-normal">Subtotal</th>
                                            <td className="py-2 text-right">{formatNumber(Math.abs(Number(selectedSale.subtotal)))}</td>
                                        </tr>
                                        {Number(selectedSale.discount) > 0 && (
                                            <tr>
                                                <th colSpan={3} className="py-1 text-right text-slate-500 font-normal">Discount</th>
                                                <td className="py-1 text-right text-red-500">-{formatNumber(Number(selectedSale.discount))}</td>
                                            </tr>
                                        )}
                                        {Number(selectedSale.tax) > 0 && (
                                            <tr>
                                                <th colSpan={3} className="py-1 text-right text-slate-500 font-normal">Tax</th>
                                                <td className="py-1 text-right">{formatNumber(Number(selectedSale.tax))}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <th colSpan={3} className="py-3 text-right font-bold text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wider">Total</th>
                                            <td className="py-3 text-right font-bold text-lg text-slate-900 dark:text-slate-100">
                                                {Number(selectedSale.total) < 0 ? '-' : ''}{formatNumber(Math.abs(Number(selectedSale.total)))}
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
