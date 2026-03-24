import React, { useState, useEffect, useCallback } from "react";
import {
    dashboardApi,
    DateRangeSummary,
    TopProduct,
    PaymentMethodStat,
    CashierStat,
    ProductProfitStat,
    ProductProfitSummary,
} from "@/lib/dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    TrendingUp,
    TrendingDown,
    BarChart2,
    ShoppingBag,
    CreditCard,
    Users,
    Download,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/currency";

// ─── Helper: CSV Download ────────────────────────────────────────────────────
function downloadCSV(filename: string, rows: (string | number)[][], headers: string[]) {
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Helper: KPI Card ────────────────────────────────────────────────────────
function KpiCard({
    title, value, sub, positive = true, icon: Icon, highlight,
}: {
    title: string; value: string; sub?: string; positive?: boolean;
    icon: React.ElementType; highlight?: "green" | "red" | "blue" | "amber";
}) {
    const colorMap = {
        green: "text-emerald-600 dark:text-emerald-400",
        red: "text-red-500 dark:text-red-400",
        blue: "text-blue-600 dark:text-blue-400",
        amber: "text-amber-600 dark:text-amber-400",
    };
    const color = highlight ? colorMap[highlight] : "text-slate-900 dark:text-slate-50";
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                {sub && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                        {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {sub}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
const todayStr = () => format(new Date(), "yyyy-MM-dd");
const monthStartStr = () => format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

const dateInputCls = "flex h-9 w-full sm:w-auto rounded-md border border-emerald-500/50 bg-white dark:bg-slate-950 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 dark:border-emerald-500/20";

function DateFilter({
    from, setFrom, to, setTo, onApply, loading,
}: {
    from: string; setFrom: (v: string) => void;
    to: string; setTo: (v: string) => void;
    onApply: () => void; loading: boolean;
}) {
    return (
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">From:</label>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={dateInputCls} />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">To:</label>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} className={dateInputCls} />
                </div>
            </div>
            <Button size="sm" onClick={onApply} disabled={loading} className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700">
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />Apply
            </Button>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<"summary" | "products" | "cashier" | "profit">("summary");

    // ── Tab 1: Revenue Summary ───────────────────────────────────────────────
    const [sumFrom, setSumFrom] = useState(monthStartStr);
    const [sumTo, setSumTo] = useState(todayStr);
    const [summary, setSummary] = useState<DateRangeSummary | null>(null);
    const [loadSummary, setLoadSummary] = useState(false);

    const fetchSummary = useCallback(async () => {
        setLoadSummary(true);
        try { const d = await dashboardApi.getReports({ type: "date_range_summary", date_from: sumFrom, date_to: sumTo }); setSummary(d); }
        catch { /* ignore */ } finally { setLoadSummary(false); }
    }, [sumFrom, sumTo]);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);

    // ── Tab 2: Top Products ──────────────────────────────────────────────────
    const [prodFrom, setProdFrom] = useState(monthStartStr);
    const [prodTo, setProdTo] = useState(todayStr);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [loadProd, setLoadProd] = useState(false);

    const fetchTopProducts = useCallback(async () => {
        setLoadProd(true);
        try { const d = await dashboardApi.getReports({ type: "top_products", date_from: prodFrom, date_to: prodTo }); setTopProducts(d.products || []); }
        catch { /* ignore */ } finally { setLoadProd(false); }
    }, [prodFrom, prodTo]);

    useEffect(() => { fetchTopProducts(); }, [fetchTopProducts]);

    // ── Tab 3: Cashier & Payments ────────────────────────────────────────────
    const [cpFrom, setCpFrom] = useState(monthStartStr);
    const [cpTo, setCpTo] = useState(todayStr);
    const [payMethods, setPayMethods] = useState<PaymentMethodStat[]>([]);
    const [cashiers, setCashiers] = useState<CashierStat[]>([]);
    const [loadCp, setLoadCp] = useState(false);

    const fetchCashierPayment = useCallback(async () => {
        setLoadCp(true);
        try {
            const [pm, cp] = await Promise.all([
                dashboardApi.getReports({ type: "payment_methods", date_from: cpFrom, date_to: cpTo }),
                dashboardApi.getReports({ type: "cashier_performance", date_from: cpFrom, date_to: cpTo }),
            ]);
            setPayMethods(pm.methods || []);
            setCashiers(cp.cashiers || []);
        } catch { /* ignore */ } finally { setLoadCp(false); }
    }, [cpFrom, cpTo]);

    useEffect(() => { fetchCashierPayment(); }, [fetchCashierPayment]);

    // ── Tab 4: Profit Tracking ───────────────────────────────────────────────
    const [pfFrom, setPfFrom] = useState(monthStartStr);
    const [pfTo, setPfTo] = useState(todayStr);
    const [profitProducts, setProfitProducts] = useState<ProductProfitStat[]>([]);
    const [profitSummary, setProfitSummary] = useState<ProductProfitSummary | null>(null);
    const [loadProfit, setLoadProfit] = useState(false);

    const fetchProfit = useCallback(async () => {
        setLoadProfit(true);
        try {
            const d = await dashboardApi.getReports({ type: "product_profit", date_from: pfFrom, date_to: pfTo });
            setProfitProducts(d.products || []);
            setProfitSummary(d.summary || null);
        } catch { /* ignore */ } finally { setLoadProfit(false); }
    }, [pfFrom, pfTo]);

    useEffect(() => { fetchProfit(); }, [fetchProfit]);

    const paymentMethodLabels: Record<string, string> = {
        cash: "Cash", card: "Card / POS", bank_transfer: "Bank Transfer", wallet: "Mobile Wallet", credit: "Credit",
    };
    const totalPayment = payMethods.reduce((s, m) => s + Number(m.total_amount), 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 uppercase">Reports & Analytics</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Revenue trends, best-sellers, payment breakdown, staff performance, and profit tracking.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 pb-2">
                    {(["summary", "products", "cashier", "profit"] as const).map((tab) => {
                        const icons = { summary: BarChart2, products: ShoppingBag, cashier: Users, profit: DollarSign };
                        const labels = { summary: "Summary", products: "Top Products", cashier: "Cashier & Payments", profit: "Profit Tracking" };
                        const Icon = icons[tab];
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium transition-all rounded-md flex-shrink-0 ${activeTab === tab
                                    ? "bg-emerald-600 text-white shadow-md font-semibold"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"}`}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{labels[tab]}</span>
                                <span className="sm:hidden">{labels[tab].split(" ")[0]}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeTab === "summary" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                        <DateFilter from={sumFrom} setFrom={setSumFrom} to={sumTo} setTo={setSumTo} onApply={fetchSummary} loading={loadSummary} />
                        <Button variant="outline" size="sm" onClick={() => {
                            if (!summary) return;
                            downloadCSV(`revenue_${sumFrom}_${sumTo}.csv`,
                                summary.daily_breakdown.map(d => [d.date, Number(d.gross_sales).toFixed(2), Number(d.returns).toFixed(2), Number(d.net_revenue).toFixed(2), d.transactions]),
                                ["Date", "Gross Sales", "Returns", "Net Revenue", "Transactions"]);
                        }}>
                            <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
                        </Button>
                    </div>
                    <dl className="mt-4 grid grid-cols-1 divide-slate-200 overflow-hidden rounded-lg bg-white shadow-sm md:grid-cols-4 md:divide-x md:divide-y-0 dark:divide-white/10 dark:bg-slate-800/75 dark:shadow-none dark:ring-1 dark:ring-white/10 border border-slate-200 dark:border-white/10">
                        {[
                            { name: 'Gross Sales', stat: formatNumber(summary?.gross_sales || 0), color: 'text-emerald-600 dark:text-emerald-400', valueColor: 'text-slate-800 dark:text-slate-200', icon: TrendingUp },
                            { name: 'Returns', stat: `-${formatNumber(summary?.returns || 0)}`, color: 'text-red-500 dark:text-red-400', valueColor: 'text-slate-800 dark:text-slate-200', icon: TrendingDown },
                            { name: 'Net Revenue', stat: `${Number(summary?.net_revenue || 0) < 0 ? '-' : ''}${formatNumber(Math.abs(Number(summary?.net_revenue || 0)))}`, color: 'text-slate-600 dark:text-slate-400', valueColor: Number(summary?.net_revenue || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400', icon: TrendingUp },
                            { name: 'Transactions', stat: (summary?.transaction_count || 0).toLocaleString(), color: 'text-slate-500 dark:text-slate-400', valueColor: 'text-slate-800 dark:text-slate-200', icon: BarChart2 },
                        ].map((item) => (
                            <div key={item.name} className="px-4 py-5 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                <dt className={`text-sm uppercase font-medium ${item.color} flex items-center gap-2`}>
                                    <item.icon className="h-3.5 w-3.5" />
                                    {item.name}
                                </dt>
                                <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                                    <div className={`flex items-baseline text-2xl font-bold ${item.valueColor}`}>
                                        {loadSummary ? <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" /> : item.stat}
                                    </div>
                                </dd>
                            </div>
                        ))}
                    </dl>
                    {/* <div className="grid gap-4 sm:grid-cols-2">
                        <KpiCard title="Avg Order Value" value={formatCurrency(summary?.avg_order_value || 0)} icon={ArrowUpRight} highlight="amber" />
                        <KpiCard title="Return Rate" value={summary && summary.gross_sales > 0 ? `${((summary.returns / summary.gross_sales) * 100).toFixed(1)}%` : "0.0%"} positive={false} icon={ArrowDownRight} highlight="red" />
                    </div> */}
                    <Card>
                        <CardHeader><CardTitle className="text-base">Day-by-Day Breakdown</CardTitle></CardHeader>
                        <CardContent>
                            {loadSummary ? (
                                <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />)}</div>
                            ) : summary?.daily_breakdown && summary.daily_breakdown.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Date</th>
                                                <th className="px-4 py-3 text-right">Gross Sales (MMK)</th>
                                                <th className="px-4 py-3 text-right">Returns (MMK)</th>
                                                <th className="px-4 py-3 text-right">Net Rev (MMK)</th>
                                                <th className="px-4 py-3 font-medium text-right">Transactions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {summary.daily_breakdown.map((d, i) => (
                                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-4 py-3 font-medium">{format(new Date(d.date), "MMM d, yyyy")}</td>
                                                    <td className="px-4 py-3 text-right text-emerald-600">{formatNumber(Number(d.gross_sales))}</td>
                                                    <td className="px-4 py-3 text-right text-red-500">{Number(d.returns) !== 0 ? `-${formatNumber(Math.abs(Number(d.returns)))}` : "—"}</td>
                                                    <td className="px-4 py-3 text-right font-semibold">{formatNumber(Number(d.net_revenue))}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{Number(d.transactions)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-semibold">
                                            <tr>
                                                <td className="px-4 py-3">TOTAL</td>
                                                <td className="px-4 py-3 text-right text-emerald-600">{formatNumber(summary.gross_sales)}</td>
                                                <td className="px-4 py-3 text-right text-red-500">-{formatNumber(summary.returns)}</td>
                                                <td className="px-4 py-3 text-right">{formatNumber(summary.net_revenue)}</td>
                                                <td className="px-4 py-3 text-right">{summary.transaction_count}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400">No sales data for this period.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === "products" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                        <DateFilter from={prodFrom} setFrom={setProdFrom} to={prodTo} setTo={setProdTo} onApply={fetchTopProducts} loading={loadProd} />
                        <Button variant="outline" size="sm" onClick={() => {
                            downloadCSV(`top_products_${prodFrom}_${prodTo}.csv`,
                                topProducts.map((p, i) => [i + 1, p.name, p.total_qty_sold, Number(p.total_revenue).toFixed(2), p.order_count]),
                                ["Rank", "Product Name", "Qty Sold", "Revenue", "Order Count"]);
                        }}>
                            <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
                        </Button>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-emerald-500" />Top 20 Best-Selling Products</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadProd ? (
                                <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />)}</div>
                            ) : topProducts.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                                            <tr>
                                                <th className="px-4 py-3 font-medium w-10">#</th>
                                                <th className="px-4 py-3 font-medium">Product Name</th>
                                                <th className="px-4 py-3 font-medium text-right">Qty Sold</th>
                                                <th className="px-4 py-3 font-medium text-right uppercase tracking-wider text-[10px]">Revenue (MMK)</th>
                                                <th className="px-4 py-3 font-medium text-right">Orders</th>
                                                <th className="px-4 py-3 font-medium text-right">Avg / Unit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {topProducts.map((p, i) => (
                                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{p.name}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">{Number(p.total_qty_sold).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatNumber(Number(p.total_revenue))}</td>
                                                    <td className="px-4 py-3 text-right text-slate-500">{Number(p.order_count)}</td>
                                                    <td className="px-4 py-3 text-right text-slate-500">
                                                        {p.total_qty_sold > 0 ? formatNumber(Number(p.total_revenue) / Number(p.total_qty_sold)) : "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400">No product sales data for this period.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ─── TAB 3: Cashier & Payments ───────────────────── */}
            {activeTab === "cashier" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                        <DateFilter from={cpFrom} setFrom={setCpFrom} to={cpTo} setTo={setCpTo} onApply={fetchCashierPayment} loading={loadCp} />
                        <Button variant="outline" size="sm" onClick={() => {
                            downloadCSV(`cashier_${cpFrom}_${cpTo}.csv`,
                                cashiers.map((c, i) => [i + 1, c.name, c.sales_count, Number(c.total_revenue).toFixed(2), Number(c.avg_sale_value).toFixed(2)]),
                                ["Rank", "Cashier Name", "Sales Count", "Total Revenue", "Avg Sale Value"]);
                        }}>
                            <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
                        </Button>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Payment Methods */}
                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4 text-emerald-500" />Payment Method Breakdown</CardTitle></CardHeader>
                            <CardContent>
                                {loadCp ? (
                                    <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />)}</div>
                                ) : payMethods.length > 0 ? (
                                    <div className="space-y-4">
                                        {payMethods.map(m => {
                                            const pct = totalPayment > 0 ? (Number(m.total_amount) / totalPayment) * 100 : 0;
                                            const barColor: Record<string, string> = { cash: "bg-emerald-500", card: "bg-blue-500", bank_transfer: "bg-indigo-500", wallet: "bg-purple-500", credit: "bg-amber-500" };
                                            return (
                                                <div key={m.method}>
                                                    <div className="flex items-center justify-between text-sm mb-1">
                                                        <span className="font-medium capitalize">{paymentMethodLabels[m.method] || m.method}</span>
                                                        <span className="text-slate-500">{formatNumber(Number(m.total_amount))} · {m.transaction_count} txns</span>
                                                    </div>
                                                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                        <div className={`h-full rounded-full ${barColor[m.method] || "bg-slate-400"} transition-all duration-700`} style={{ width: `${pct.toFixed(1)}%` }} />
                                                    </div>
                                                    <div className="text-xs text-right text-slate-400 mt-0.5">{pct.toFixed(1)}%</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center text-slate-400">No payment data for this period.</div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Cashier Performance */}
                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-emerald-500" />Cashier Performance</CardTitle></CardHeader>
                            <CardContent>
                                {loadCp ? (
                                    <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />)}</div>
                                ) : cashiers.length > 0 ? (
                                    <div className="space-y-2">
                                        {(() => {
                                            const maxRev = Math.max(...cashiers.map(c => Number(c.total_revenue)));
                                            return cashiers.map((c, i) => {
                                                const pct = maxRev > 0 ? (Number(c.total_revenue) / maxRev) * 100 : 0;
                                                const medals = ["🥇", "🥈", "🥉"];
                                                return (
                                                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold">
                                                            {i < 3 ? medals[i] : <span className="text-slate-500">{i + 1}</span>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-medium text-sm truncate">{c.name}</span>
                                                                <span className="font-semibold text-emerald-600 text-sm ml-2 whitespace-nowrap">{formatNumber(Number(c.total_revenue))}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-400 mb-1.5">{c.sales_count} sales · avg {formatNumber(Number(c.avg_sale_value))}</p>
                                                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                                <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center text-slate-400">No cashier data for this period.</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* ─── TAB 4: Profit Tracking ───────────────────────── */}
            {activeTab === "profit" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                        <DateFilter from={pfFrom} setFrom={setPfFrom} to={pfTo} setTo={setPfTo} onApply={fetchProfit} loading={loadProfit} />
                        <Button variant="outline" size="sm" onClick={() => {
                            downloadCSV(`profit_${pfFrom}_${pfTo}.csv`,
                                profitProducts.map((p, i) => [i + 1, p.name, p.total_qty_sold, p.total_revenue.toFixed(2), p.total_cost.toFixed(2), p.gross_profit.toFixed(2), p.margin_pct.toFixed(2) + "%", p.has_cost_data ? "Yes" : "Partial"]),
                                ["Rank", "Product", "Qty Sold", "Revenue", "Cost", "Profit", "Margin %", "Cost Data Complete"]);
                        }}>
                            <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
                        </Button>
                    </div>

                    {profitSummary && (
                        <div className="space-y-4">
                            <dl className="grid grid-cols-1 divide-slate-200 overflow-hidden rounded-lg bg-white shadow-sm md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-white/10 dark:bg-slate-800/75 dark:shadow-none dark:ring-1 dark:ring-white/10 border border-slate-200 dark:border-white/10">
                                {[
                                    { name: 'Total Revenue', stat: formatNumber(profitSummary.total_revenue), color: 'text-emerald-600 dark:text-emerald-400', valueColor: 'text-slate-800 dark:text-slate-200', icon: TrendingUp },
                                    { name: 'Total Cost', stat: formatNumber(profitSummary.total_cost), color: 'text-red-500 dark:text-red-400', valueColor: 'text-slate-800 dark:text-slate-200', icon: TrendingDown },
                                    { name: 'Total Profit', stat: `${Number(profitSummary.total_profit) < 0 ? '-' : ''}${formatNumber(Math.abs(Number(profitSummary.total_profit)))}`, color: 'text-slate-600 dark:text-slate-400', valueColor: Number(profitSummary.total_profit) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400', icon: TrendingUp },
                                ].map((item) => (
                                    <div key={item.name} className="px-4 py-5 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                        <dt className={`text-sm uppercase font-medium ${item.color} flex items-center gap-2`}>
                                            <item.icon className="h-3.5 w-3.5" />
                                            {item.name}
                                        </dt>
                                        <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                                            <div className={`flex items-baseline text-2xl font-bold ${item.valueColor}`}>
                                                {loadProfit ? <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" /> : item.stat}
                                            </div>
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                            <KpiCard
                                title="Overall Margin" value={`${profitSummary.overall_margin.toFixed(1)}%`}
                                sub={profitSummary.overall_margin >= 30 ? "Healthy margin" : profitSummary.overall_margin >= 10 ? "Low margin" : "Thin margin"}
                                positive={profitSummary.overall_margin >= 20} icon={ArrowUpRight}
                                highlight={profitSummary.overall_margin >= 30 ? "green" : profitSummary.overall_margin >= 10 ? "amber" : "red"}
                            />
                        </div>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-500" /> Product Profit Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadProfit ? (
                                <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />)}</div>
                            ) : profitProducts.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                                            <tr>
                                                <th className="px-4 py-3 font-medium w-8">#</th>
                                                <th className="px-4 py-3 font-medium">Product</th>
                                                <th className="px-4 py-3 font-medium text-right">Qty Sold</th>
                                                <th className="px-4 py-3 text-right">Revenue (MMK)</th>
                                                <th className="px-4 py-3 text-right">Cost (MMK)</th>
                                                <th className="px-4 py-3 text-right">Profit (MMK)</th>
                                                <th className="px-4 py-3 font-medium text-right">Margin</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {profitProducts.map((p, i) => {
                                                const mc = p.margin_pct >= 30 ? "text-emerald-600 dark:text-emerald-500 font-bold" : p.margin_pct >= 10 ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-red-500 font-semibold";
                                                const pc = p.gross_profit >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-500";
                                                return (
                                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-slate-800 dark:text-slate-100">{p.name}</div>
                                                            {!p.has_cost_data && <div className="text-xs text-amber-500 mt-0.5">⚠ Some items missing purchase price</div>}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">{Number(p.total_qty_sold).toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right font-medium">{formatNumber(p.total_revenue)}</td>
                                                        <td className="px-4 py-3 text-right text-red-400">{p.total_cost > 0 ? formatNumber(p.total_cost) : <span className="text-slate-300">—</span>}</td>
                                                        <td className={`px-4 py-3 text-right font-semibold ${pc}`}>{formatNumber(p.gross_profit)}</td>
                                                        <td className={`px-4 py-3 text-right ${mc}`}>
                                                            {p.margin_pct >= 30 ? "🟢" : p.margin_pct >= 10 ? "🟡" : "🔴"} {p.margin_pct.toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        {profitSummary && (
                                            <tfoot className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-semibold">
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3">TOTAL</td>
                                                    <td className="px-4 py-3 text-right text-blue-600">{formatNumber(profitSummary.total_revenue)}</td>
                                                    <td className="px-4 py-3 text-right text-red-400">{formatNumber(profitSummary.total_cost)}</td>
                                                    <td className="px-4 py-3 text-right text-emerald-600">{formatNumber(profitSummary.total_profit)}</td>
                                                    <td className="px-4 py-3 text-right">{profitSummary.overall_margin.toFixed(1)}%</td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400">No sales data found for this period.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
