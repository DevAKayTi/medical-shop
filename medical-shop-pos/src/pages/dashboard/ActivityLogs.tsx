import { useEffect, useState } from "react";
import { activityLogApi, ApiActivityLog } from "@/lib/activityLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { format } from "date-fns";
import { Search, Loader2, History } from "lucide-react";

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<ApiActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await activityLogApi.list({ search, page });
            setLogs(response.data);
            setTotalPages(response.last_page || 1);
        } catch (error) {
            console.error("Failed to fetch activity logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, page]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-50">
                        <History className="h-8 w-8 text-blue-600" />
                        Activity Logs
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Track system activities and user actions.
                    </p>
                </div>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search logs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Created At</th>
                                    <th className="px-4 py-3 font-medium">Module</th>
                                    <th className="px-4 py-3 font-medium">Action</th>
                                    <th className="px-4 py-3 font-medium">Description</th>
                                    <th className="px-4 py-3 font-medium">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {loading && logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="h-24 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                Loading activity logs...
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="h-24 text-center text-slate-500 font-medium">
                                            No activity logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                                            <td className="px-4 py-3 font-medium whitespace-nowrap">
                                                {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                                                    {log.module}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                                {log.action}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                {log.description}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-mono text-slate-500">
                                                {log.ip_address}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-slate-500">
                            Showing page {page} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
