import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search, Plus, Store, CheckCircle2, XCircle,
    Clock, Loader2, RefreshCw, ShieldCheck, ShieldOff,
    MoreHorizontal, Edit, Trash2, CheckCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";

type ShopStatus = "pending" | "active" | "suspended" | "cancelled";

interface Shop {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    city: string | null;
    country: string | null;
    slug: string;
    status: ShopStatus;
    created_at: string;
}

export function ShopsPage() {
    const navigate = useNavigate();
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("All");
    const [actionId, setActionId] = useState<string | null>(null);

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        setLoading(true);
        try {
            const data = await apiClient("/shops");
            // Handle paginated response shape: { data: [...] }
            setShops(Array.isArray(data) ? data : (data.data ?? []));
        } catch (err) {
            console.error("Failed to fetch shops", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (shop: Shop) => {
        if (!confirm(`Approve "${shop.name}"?`)) return;
        setActionId(shop.id);
        try {
            const updated = await apiClient(`/shops/${shop.id}/approve`, { method: "PATCH" });
            setShops(prev => prev.map(s => s.id === shop.id ? { ...s, status: updated.shop?.status ?? "active" } : s));
        } catch (err) {
            console.error("Failed to approve shop", err);
        } finally {
            setActionId(null);
        }
    };

    const handleSuspend = async (shop: Shop) => {
        if (!confirm(`Suspend "${shop.name}"?`)) return;
        setActionId(shop.id);
        try {
            const updated = await apiClient(`/shops/${shop.id}/suspend`, { method: "PATCH" });
            setShops(prev => prev.map(s => s.id === shop.id ? { ...s, status: updated.shop?.status ?? "suspended" } : s));
        } catch (err) {
            console.error("Failed to suspend shop", err);
        } finally {
            setActionId(null);
        }
    };

    const handleDelete = async (shop: Shop) => {
        if (!confirm(`Are you sure you want to delete "${shop.name}"? This action cannot be undone.`)) return;
        setActionId(shop.id);
        try {
            await apiClient(`/shops/${shop.id}`, { method: "DELETE" });
            setShops(prev => prev.filter(s => s.id !== shop.id));
        } catch (err) {
            console.error("Failed to delete shop", err);
            alert("Failed to delete shop. Check console for details.");
        } finally {
            setActionId(null);
        }
    };

    const filtered = useMemo(() => {
        let list = [...shops];
        if (search) list = list.filter((s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase()) ||
            (s.city ?? "").toLowerCase().includes(search.toLowerCase()));
        if (filterStatus !== "All") list = list.filter((s) => s.status === filterStatus);
        return list;
    }, [shops, search, filterStatus]);

    const StatusBadge = ({ status }: { status: ShopStatus }) => {
        if (status === "active") return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 gap-1 border-emerald-200"><CheckCircle2 className="h-3 w-3" /> Active</Badge>;
        if (status === "pending") return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
        if (status === "suspended") return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Suspended</Badge>;
        return <Badge variant="outline" className="gap-1 text-muted-foreground"><XCircle className="h-3 w-3" /> Cancelled</Badge>;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">All Shops</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage all POS platform tenants and their status.</p>
                </div>
                <Button size="sm" className="gap-1.5" onClick={() => navigate("/shops/create")}>
                    <Plus className="h-4 w-4" /> Create Shop
                </Button>
            </div>

            {/* Toolbar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text" placeholder="Search shops or email…" value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                            className="text-sm rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring">
                            <option value="All">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <Button variant="outline" size="sm" onClick={fetchShops} disabled={loading} className="shrink-0 gap-1.5">
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Fetching shops...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Shop</TableHead>
                                    <TableHead className="hidden md:table-cell">Email</TableHead>
                                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="hidden xl:table-cell">Created</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((shop) => (
                                    <TableRow key={shop.id}>
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                    <Store className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{shop.name}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{shop.slug}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-sm">{shop.email}</TableCell>
                                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                            {[shop.city, shop.country].filter(Boolean).join(", ") || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={shop.status} />
                                        </TableCell>
                                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                                            {new Date(shop.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={actionId === shop.id}>
                                                        {actionId === shop.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                        ) : (
                                                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[160px]">
                                                    <DropdownMenuItem onClick={() => navigate(`/shops/edit/${shop.id}`)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Edit Details</span>
                                                    </DropdownMenuItem>

                                                    {shop.status === "pending" && (
                                                        <DropdownMenuItem onClick={() => handleApprove(shop)}>
                                                            <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" />
                                                            <span className="text-emerald-600">Approve Shop</span>
                                                        </DropdownMenuItem>
                                                    )}

                                                    {shop.status === "suspended" && (
                                                        <DropdownMenuItem onClick={() => handleApprove(shop)}>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                                                            <span className="text-emerald-600">Activate Shop</span>
                                                        </DropdownMenuItem>
                                                    )}

                                                    {shop.status === "active" && (
                                                        <DropdownMenuItem onClick={() => handleSuspend(shop)}>
                                                            <ShieldOff className="mr-2 h-4 w-4 text-amber-600" />
                                                            <span className="text-amber-600">Suspend Shop</span>
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => handleDelete(shop)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Delete Shop</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {!loading && filtered.length === 0 && (
                        <div className="py-12 text-center text-sm text-muted-foreground">No shops found.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
