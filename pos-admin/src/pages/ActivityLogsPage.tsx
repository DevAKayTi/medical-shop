import { useState, useEffect } from "react";
import { History, Search, Filter, Loader2, Store, Calendar, User, Tag, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { format } from "date-fns";

interface Shop {
    id: string;
    name: string;
}

interface ActivityLog {
    id: string;
    shop_id: string | null;
    shop?: Shop;
    user_type: string;
    user_id: string;
    action: string;
    module: string | null;
    description: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export function ActivityLogsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [filters, setFilters] = useState({
        shop_id: "",
        module: "",
        action: "",
        page: 1,
    });

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const response = await apiClient("/shops?per_page=100");
                setShops(response.data || []);
            } catch (error) {
                console.error("Failed to fetch shops", error);
            }
        };
        fetchShops();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.shop_id) params.append("shop_id", filters.shop_id);
            if (filters.module) params.append("module", filters.module);
            if (filters.action) params.append("action", filters.action);
            params.append("page", filters.page.toString());

            const response = await apiClient(`/activity-logs?${params.toString()}`);
            setLogs(response.data || []);
            setPagination({
                current_page: response.current_page,
                last_page: response.last_page,
                per_page: response.per_page,
                total: response.total,
            });
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filters.shop_id, filters.module, filters.page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, page: 1 }));
        fetchLogs();
    };

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight">System Activity Logs</h2>
                <p className="text-sm text-muted-foreground">
                    Audit trail of all actions performed by platform and shop users.
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Target Shop</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={filters.shop_id}
                                onChange={(e) => setFilters(prev => ({ ...prev, shop_id: e.target.value, page: 1 }))}
                            >
                                <option value="">All Shops</option>
                                <option value="platform">Platform Only</option>
                                {shops.map((shop) => (
                                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Module</label>
                            <Input
                                placeholder="e.g. Authentication, Shops"
                                value={filters.module}
                                onChange={(e) => setFilters(prev => ({ ...prev, module: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Action Keyword</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="Search action..."
                                    value={filters.action}
                                    onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <Button type="submit" className="flex-1 gap-2">
                                <Filter className="h-4 w-4" />
                                Apply Filters
                            </Button>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setFilters({ shop_id: "", module: "", action: "", page: 1 })}
                            >
                                Reset
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead>Shop</TableHead>
                                <TableHead>Module</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>User Type</TableHead>
                                <TableHead className="max-w-[300px]">Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Loading logs...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        No activity logs found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs font-mono">
                                            {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                                        </TableCell>
                                        <TableCell>
                                            {log.shop ? (
                                                <div className="flex items-center gap-2">
                                                    <Store className="h-4 w-4 text-primary" />
                                                    <span className="font-medium">{log.shop.name}</span>
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="bg-muted/50">Platform</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {log.module ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Tag className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-sm">{log.module}</span>
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{log.action}</TableCell>
                                        <TableCell>
                                            <Badge variant={log.user_type === 'platform_user' ? 'default' : 'secondary'}>
                                                {log.user_type.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate" title={log.description || ""}>
                                            {log.description || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {pagination && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} total logs)
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.current_page === 1}
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.current_page === pagination.last_page}
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            <div className="flex items-center gap-2 text-sm text-muted-foreground italic bg-muted/20 p-4 rounded-lg border border-dashed">
                <Info className="h-4 w-4" />
                Audit logs are retained for 90 days. Use the filters to narrow down specific events.
            </div>
        </div>
    );
}
