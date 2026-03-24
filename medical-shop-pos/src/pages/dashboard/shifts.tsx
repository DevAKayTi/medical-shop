import { formatNumber } from '@/lib/currency';
import { useState, useEffect } from "react";
import { shiftSessionApi, ApiShiftSession } from "@/lib/registers";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Store, Clock } from "lucide-react";

export default function ShiftsPage() {
    const [sessions, setSessions] = useState<ApiShiftSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    useEffect(() => {
        loadSessions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const data = await shiftSessionApi.list({
                page
            });
            setSessions(data.data);
            setLastPage(data.last_page);
        } catch (err: any) {
            console.error("Failed to load shift sessions:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="max-w-full mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 uppercase">Shift History</h1>
                    <p className="text-slate-500 dark:text-slate-400">View and manage POS shift sessions.</p>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-3 font-medium">Register</th>
                                <th className="px-5 py-3 font-medium">Cashier</th>
                                <th className="px-5 py-3 font-medium">Opened At</th>
                                <th className="px-5 py-3 font-medium">Closed At</th>
                                <th className="px-5 py-3 font-medium">Status</th>
                                <th className="px-5 py-3 font-medium text-right">Opening (MMK)</th>
                                <th className="px-5 py-3 font-medium text-right">Sales / Refunds (MMK)</th>
                                <th className="px-5 py-3 font-medium text-right border-l dark:border-slate-800">Expected (MMK)</th>
                                <th className="px-5 py-3 font-medium text-right">Actual Closing (MMK)</th>
                                <th className="px-5 py-3 font-medium text-right">Difference (MMK)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-blue-600"></div>
                                            Loading shift history...
                                        </div>
                                    </td>
                                </tr>
                            ) : sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-16 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Clock className="h-10 w-10 text-slate-300 mb-3" />
                                            <p>No shift sessions found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sessions.map(session => {
                                    const opening = Number(session.opening_cash);
                                    const sales = Number(session.total_sales);
                                    const refunds = Number(session.total_refunds);
                                    const expected = opening + sales - refunds;
                                    const actual = session.closing_cash !== null ? Number(session.closing_cash) : null;
                                    const diff = actual !== null ? actual - expected : null;

                                    return (
                                        <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                                                    <Store className="h-4 w-4 text-slate-400" />
                                                    {session.register?.name || "Unknown"}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-slate-900 dark:text-slate-100">{session.user?.name || "Unknown"}</div>
                                                <div className="text-xs text-slate-500">{session.user?.email}</div>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                {formatDate(session.opened_at)}
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                {formatDate(session.closed_at)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${session.status === 'open' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                    {session.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right text-slate-600 dark:text-slate-300">
                                                {formatNumber(opening)}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="text-emerald-600 dark:text-emerald-400">{sales > 0 ? `+${formatNumber(sales)}` : formatNumber(0)}</div>
                                                {refunds > 0 && <div className="text-xs text-red-500">-{formatNumber(refunds)}</div>}
                                            </td>
                                            <td className="px-5 py-4 text-right border-l dark:border-slate-800 font-semibold text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-900/20">
                                                {formatNumber(expected)}
                                            </td>
                                            <td className="px-5 py-4 text-right font-medium text-slate-900 dark:text-slate-100">
                                                {actual !== null ? formatNumber(actual) : "-"}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {diff !== null ? (
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${diff === 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : diff > 0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                        {diff > 0 ? `+${formatNumber(diff)}` : formatNumber(diff)}
                                                    </span>
                                                ) : "-"}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {lastPage > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-4">
                        <p className="text-sm text-slate-500">
                            Page <span className="font-medium">{page}</span> of <span className="font-medium">{lastPage}</span>
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                                disabled={page === lastPage}
                            >
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
