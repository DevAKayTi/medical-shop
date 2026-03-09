import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreHorizontal, ShieldCheck, XCircle, CheckCircle, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api";

interface ShopUser {
    id: string;
    name: string;
    email: string;
    is_active: boolean;
    shop: { id: string; name: string } | null;
    role: { name: string; slug: string } | null;
    created_at: string;
}

export function ShopUsersPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<ShopUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await apiClient(`/shop-users?search=${search}`);
            setUsers(data.data || []);
        } catch (error) {
            console.error("Failed to fetch shop users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await apiClient(`/shop-users/${id}/toggle-status`, {
                method: "PATCH",
                body: JSON.stringify({ is_active: !currentStatus }),
            });
            fetchUsers();
        } catch (error) {
            console.error("Failed to toggle status", error);
        }
    };

    const getRoleBadgeStyle = (slug: string) => {
        switch (slug) {
            case "admin":
                return "bg-purple-500/15 text-purple-700 border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20";
            case "manager":
                return "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
            case "staff":
                return "bg-slate-500/15 text-slate-700 border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20";
            default:
                return "bg-primary/5 text-primary border-primary/20";
        }
    };

    const handleDelete = async (user: ShopUser) => {
        if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) return;
        try {
            await apiClient(`/shop-users/${user.id}`, { method: "DELETE" });
            fetchUsers();
        } catch (error) {
            console.error("Failed to delete user", error);
            alert("Failed to delete user. Check console for details.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">All Staff</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage all staff and users belonging to tenant shops.
                    </p>
                </div>
                <Button onClick={() => navigate("/staffs/create")} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Shop User
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>User</TableHead>
                            <TableHead>Shop</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No shop users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="font-medium text-foreground">{user.name}</div>
                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        {user.shop ? (
                                            <span className="font-medium text-primary">{user.shop.name}</span>
                                        ) : (
                                            <span className="text-muted-foreground">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {user.role ? (
                                            <Badge variant="outline" className={`gap-1 ${getRoleBadgeStyle(user.role.slug)}`}>
                                                <ShieldCheck className="h-3 w-3" />
                                                {user.role.name}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground">No Role</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.is_active ? "success" : "destructive"}>
                                            {user.is_active ? "Active" : "Suspended"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`/staffs/edit/${user.id}`)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit Details</span>
                                                </DropdownMenuItem>

                                                {user.is_active ? (
                                                    <DropdownMenuItem
                                                        className="text-amber-600 focus:text-amber-600"
                                                        onClick={() => toggleStatus(user.id, true)}
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        Suspend User
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        className="text-emerald-600 focus:text-emerald-600"
                                                        onClick={() => toggleStatus(user.id, false)}
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Activate User
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleDelete(user)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Delete User</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
