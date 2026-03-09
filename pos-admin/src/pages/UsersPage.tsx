import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search, Plus, Pencil, Trash2, Mail, Phone,
    ChevronUp, ChevronDown, CheckCircle2, XCircle,
    Clock, Download, Filter, UserRound, Loader2, LogOut
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { PermissionGuard } from "@/components/PermissionGuard";

import type { User } from "@/types";

const statusConfig = {
    active: { label: "Active", variant: "success", icon: CheckCircle2 },
    inactive: { label: "Inactive", variant: "warning", icon: Clock },
};

export function UsersPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState<string | "All">("All");
    const [sortField, setSortField] = useState<keyof User>("name");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await apiClient("/users");
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("pos_access_token");
        localStorage.removeItem("pos_user");
        navigate("/login");
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete user ${name}?`)) return;
        setLoading(true);
        try {
            await apiClient(`/users/${id}`, { method: 'DELETE' });
            await fetchUsers();
        } catch (err) {
            console.error("Failed to delete user", err);
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        let list = [...users];
        if (search) list = list.filter((u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()));

        if (filterRole !== "All") {
            list = list.filter((u) => u.roles?.some(r => r.slug === filterRole));
        }

        list.sort((a, b) => {
            let av = a[sortField];
            let bv = b[sortField];

            if (sortField === "roles") {
                av = a.roles?.[0]?.name || "";
                bv = b.roles?.[0]?.name || "";
            }

            const sav = String(av || ""), sbv = String(bv || "");
            return sortDir === "asc" ? sav.localeCompare(sbv) : sbv.localeCompare(sav);
        });
        return list;
    }, [users, search, filterRole, sortField, sortDir]);

    const toggleSort = (field: keyof User) => {
        if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("asc"); }
    };

    const SortIcon = ({ field }: { field: keyof User }) => (
        sortField === field
            ? sortDir === "asc"
                ? <ChevronUp className="h-3 w-3 inline ml-1" />
                : <ChevronDown className="h-3 w-3 inline ml-1" />
            : <ChevronDown className="h-3 w-3 inline ml-1 opacity-25" />
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">System Users</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage all system users and their assigned roles.</p>
                </div>
                <div className="flex gap-2">
                    <PermissionGuard permissions="create-user">
                        <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => navigate("/users/create")}
                        >
                            <Plus className="h-4 w-4" />
                            Add User
                        </Button>
                    </PermissionGuard>
                </div>
            </div>

            {/* Toolbar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text" placeholder="Search users…" value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                            className="text-sm rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring">
                            <option value="All">All Roles</option>
                            <option value="administrator">Administrator</option>
                            <option value="cashier">Cashier</option>
                        </select>
                        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="shrink-0 gap-1.5">
                            <Clock className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
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
                            <p className="text-sm text-muted-foreground">Fetching users from POS API...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6 cursor-pointer select-none" onClick={() => toggleSort("name")}>
                                        User <SortIcon field="name" />
                                    </TableHead>
                                    <TableHead className="hidden md:table-cell">Roles</TableHead>
                                    <TableHead className="hidden lg:table-cell">Email</TableHead>
                                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                                    <TableHead className="cursor-pointer select-none">Status</TableHead>
                                    <TableHead className="hidden xl:table-cell cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                                        Joined <SortIcon field="created_at" />
                                    </TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles?.map(role => (
                                                    <Badge key={role.id} variant="secondary" className="text-[10px] py-0 px-2">
                                                        {role.name}
                                                    </Badge>
                                                ))}
                                                {(!user.roles || user.roles.length === 0) && <span className="text-xs text-muted-foreground italic">No roles</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                {user.phone ? (
                                                    <><Phone className="h-3 w-3" /> {user.phone}</>
                                                ) : <span className="italic opacity-50">None</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.is_active ? (
                                                <Badge variant="success" className="gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="warning" className="gap-1">
                                                    <Clock className="h-3 w-3" />Inactive
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <PermissionGuard permissions="update-user">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/users/edit/${user.id}`)}><Pencil className="h-3.5 w-3.5" /></Button>
                                                </PermissionGuard>
                                                <PermissionGuard permissions="delete-user">
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </PermissionGuard>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {!loading && filtered.length === 0 && (
                        <div className="py-12 text-center text-sm text-muted-foreground">No users found.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
