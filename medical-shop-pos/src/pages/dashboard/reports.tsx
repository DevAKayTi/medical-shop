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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
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
import { formatCurrency } from "@/lib/currency";

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

const dateInputCls = "flex h-9 w-full sm:w-auto rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-50";

function DateFilter({
    from, setFrom, to, setTo, onApply, loading,
}: {
    from: string; setFrom: (v: string) => void;
    to: string; setTo: (v: string) => void;
    onApply: () => void; loading: boolean;
}) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">From:</label>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={dateInputCls} />
            </div>
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">To:</label>
                <input type="date" value={to} onChange={e => setTo(e.target.value)} className={dateInputCls} />
            </div>
            <Button size="sm" onClick={onApply} disabled={loading} className="whitespace-nowrap">
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Apply
            </Button>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {

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
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Reports & Analytics</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Revenue trends, best-sellers, payment breakdown, staff performance, and profit tracking.
                </p>
            </div>

            <Tabs defaultValue="summary" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="summary"><BarChart2 className="h-4 w-4 mr-1.5 inline" />Revenue Summary</TabsTrigger>
                    <TabsTrigger value="products"><ShoppingBag className="h-4 w-4 mr-1.5 inline" />Top Products</TabsTrigger>
                    <TabsTrigger value="cashier"><Users className="h-4 w-4 mr-1.5 inline" />Cashier & Payments</TabsTrigger>
                    <TabsTrigger value="profit"><DollarSign className="h-4 w-4 mr-1.5 inline" />Profit Tracking</TabsTrigger>
                </TabsList>

                {/* ─── TAB 1: Revenue Summary ───────────────────────── */}
                <TabsContent value="summary" className="space-y-5">
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
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiCard title="Gross Sales" value={formatCurrency(summary?.gross_sales || 0)} icon={TrendingUp} highlight="green" />
                        <KpiCard title="Returns" value={`-${formatCurrency(summary?.returns || 0)}`} positive={false} icon={TrendingDown} highlight="red" />
                        <KpiCard title="Net Revenue" value={formatCurrency(summary?.net_revenue || 0)} icon={TrendingUp} highlight="blue" />
                        <KpiCard title="Transactions" value={String(summary?.transaction_count || 0)} icon={CreditCard} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <KpiCard title="Avg Order Value" value={formatCurrency(summary?.avg_order_value || 0)} icon={ArrowUpRight} highlight="amber" />
                        <KpiCard title="Return Rate" value={summary && summary.gross_sales > 0 ? `${((summary.returns / summary.gross_sales) * 100).toFixed(1)}%` : "0.0%"} positive={false} icon={ArrowDownRight} highlight="red" />
                    </div>
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
                                                <th className="px-4 py-3 font-medium text-right">Gross Sales</th>
                                                <th className="px-4 py-3 font-medium text-right">Returns</th>
                                                <th className="px-4 py-3 font-medium text-right">Net Revenue</th>
                                                <th className="px-4 py-3 font-medium text-right">Transactions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {summary.daily_breakdown.map((d, i) => (
                                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-4 py-3 font-medium">{format(new Date(d.date), "MMM d, yyyy")}</td>
                                                    <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(Number(d.gross_sales))}</td>
                                                    <td className="px-4 py-3 text-right text-red-500">{Number(d.returns) !== 0 ? `-${formatCurrency(Math.abs(Number(d.returns)))}` : "—"}</td>
                                                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(d.net_revenue))}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{Number(d.transactions)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-semibold">
                                            <tr>
                                                <td className="px-4 py-3">TOTAL</td>
                                                <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(summary.gross_sales)}</td>
                                                <td className="px-4 py-3 text-right text-red-500">-{formatCurrency(summary.returns)}</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(summary.net_revenue)}</td>
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
                </TabsContent>

                {/* ─── TAB 2: Top Products ──────────────────────────── */}
                <TabsContent value="products" className="space-y-5">
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
                            <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-indigo-500" />Top 20 Best-Selling Products</CardTitle>
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
                                                <th className="px-4 py-3 font-medium text-right">Revenue</th>
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
                                                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatCurrency(Number(p.total_revenue))}</td>
                                                    <td className="px-4 py-3 text-right text-slate-500">{Number(p.order_count)}</td>
                                                    <td className="px-4 py-3 text-right text-slate-500">
                                                        {p.total_qty_sold > 0 ? formatCurrency(Number(p.total_revenue) / Number(p.total_qty_sold)) : "—"}
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
                </TabsContent>

                {/* ─── TAB 3: Cashier & Payments ───────────────────── */}
                <TabsContent value="cashier" className="space-y-5">
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
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-500" />Payment Method Breakdown</CardTitle></CardHeader>
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
                                                        <span className="text-slate-500">{formatCurrency(Number(m.total_amount))} · {m.transaction_count} txns</span>
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
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-indigo-500" />Cashier Performance</CardTitle></CardHeader>
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
                                                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                        <div className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold">
                                                            {i < 3 ? medals[i] : <span className="text-slate-500">{i + 1}</span>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-medium text-sm truncate">{c.name}</span>
                                                                <span className="font-semibold text-emerald-600 text-sm ml-2 whitespace-nowrap">{formatCurrency(Number(c.total_revenue))}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-400 mb-1.5">{c.sales_count} sales · avg {formatCurrency(Number(c.avg_sale_value))}</p>
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
                </TabsContent>

                {/* ─── TAB 4: Profit Tracking ───────────────────────── */}
                <TabsContent value="profit" className="space-y-5">
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
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <KpiCard title="Total Revenue" value={formatCurrency(profitSummary.total_revenue)} icon={TrendingUp} highlight="blue" />
                            <KpiCard title="Total Cost" value={formatCurrency(profitSummary.total_cost)} positive={false} icon={TrendingDown} highlight="red" />
                            <KpiCard title="Gross Profit" value={formatCurrency(profitSummary.total_profit)} icon={DollarSign} highlight="green" />
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
                                                <th className="px-4 py-3 font-medium text-right">Revenue</th>
                                                <th className="px-4 py-3 font-medium text-right">Cost</th>
                                                <th className="px-4 py-3 font-medium text-right">Profit</th>
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
                                                        <td className="px-4 py-3 text-right">{formatCurrency(p.total_revenue)}</td>
                                                        <td className="px-4 py-3 text-right text-red-400">{p.total_cost > 0 ? formatCurrency(p.total_cost) : <span className="text-slate-300">—</span>}</td>
                                                        <td className={`px-4 py-3 text-right ${pc}`}>{formatCurrency(p.gross_profit)}</td>
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
                                                    <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(profitSummary.total_revenue)}</td>
                                                    <td className="px-4 py-3 text-right text-red-400">{formatCurrency(profitSummary.total_cost)}</td>
                                                    <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(profitSummary.total_profit)}</td>
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
                </TabsContent>
            </Tabs>
        </div>
    );
}
