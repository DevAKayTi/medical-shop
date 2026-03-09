import { useState, useMemo } from "react";
import {
    Search, Plus, MoreHorizontal, Pencil, Trash2,
    ChevronUp, ChevronDown, Mail, Phone, Shield,
    CheckCircle2, XCircle, Clock, Filter, Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { User, Role, Permission } from "@/types";

/* ─── Mock Data ───────────────────────────────────────────────────── */
const USERS: User[] = [
    { id: "1", name: "Alice Johnson", email: "alice@pos.io", is_active: true, created_at: "2025-01-12T00:00:00Z", updated_at: "2025-01-12T00:00:00Z", last_login_at: "Today", email_verified_at: null, roles: [{ id: "1", name: "Admin", slug: "admin", guard: "platform", description: "Full system access.", created_at: "", updated_at: "" }] },
    { id: "2", name: "Bob Martinez", email: "bob@pos.io", is_active: true, created_at: "2025-02-03T00:00:00Z", updated_at: "2025-02-03T00:00:00Z", last_login_at: "Yesterday", email_verified_at: null, roles: [{ id: "2", name: "Manager", slug: "manager", guard: "platform", description: "Manage staff.", created_at: "", updated_at: "" }] },
];

const ROLES_DATA: (Role & { color: string })[] = [
    { id: "1", name: "Admin", slug: "admin", guard: "platform", description: "Full system access.", users_count: 2, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", created_at: "", updated_at: "" },
    { id: "2", name: "Manager", slug: "manager", guard: "platform", description: "Manage sales, staff, and view reports.", users_count: 3, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", created_at: "", updated_at: "" },
];

/* ─── Permissions ─────────────────────────────────────────────────── */
const MODULES = ["Dashboard", "Orders", "Products", "Customers", "Finance", "Staff", "Settings"];
type PermKey = "view" | "create" | "edit" | "delete";

const PERMISSION_MATRIX: Record<string, Record<string, PermKey[]>> = {
    Admin: Object.fromEntries(MODULES.map((m) => [m, ["view", "create", "edit", "delete"] as PermKey[]])),
    Manager: Object.fromEntries(MODULES.map((m) => [m, m === "Settings" ? [] : ["view", "create", "edit"] as PermKey[]])),
    Cashier: Object.fromEntries(MODULES.map((m) => [m, ["Orders", "Products"].includes(m) ? ["view", "create"] as PermKey[] : (m === "Dashboard" ? ["view"] as PermKey[] : [])])),
    Viewer: Object.fromEntries(MODULES.map((m) => [m, ["Dashboard", "Finance"].includes(m) ? ["view"] as PermKey[] : []])),
};

/* ─── Status / Role badge configs ─────────────────────────────────── */
const statusConfig: Record<string, { label: string; variant: any; icon: React.ElementType }> = {
    active: { label: "Active", variant: "success", icon: CheckCircle2 },
    inactive: { label: "Inactive", variant: "warning", icon: Clock },
    suspended: { label: "Suspended", variant: "cancelled", icon: XCircle },
};

const roleBg: Record<string, string> = {
    Admin: "bg-red-500",
    Manager: "bg-violet-500",
    Cashier: "bg-blue-500",
    Viewer: "bg-slate-400",
};

const PERM_COLORS: Record<PermKey, string> = {
    view: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    create: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    edit: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

/* ─── TAB TYPES ──────────────────────────────────────────────────── */
type Tab = "users" | "roles" | "permissions";

/* ─── Sub-component: Users Tab ────────────────────────────────────── */
function UsersTab() {
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState<string | "All">("All");
    const [filterStatus, setFilterStatus] = useState<"All" | "active" | "inactive">("All");
    const [sortField, setSortField] = useState<keyof User>("name");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    const filtered = useMemo(() => {
        let list = [...USERS];
        if (search) list = list.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
        if (filterRole !== "All") list = list.filter((u) => u.roles?.some(r => r.name === filterRole));
        if (filterStatus !== "All") {
            const isActive = filterStatus === "active";
            list = list.filter((u) => u.is_active === isActive);
        }
        list.sort((a, b) => {
            let av = a[sortField];
            let bv = b[sortField];

            // Special handling for roles array sorting (by first role name)
            if (sortField === "roles") {
                av = a.roles?.[0]?.name || "";
                bv = b.roles?.[0]?.name || "";
            }

            const sav = String(av || ""), sbv = String(bv || "");
            return sortDir === "asc" ? sav.localeCompare(sbv) : sbv.localeCompare(sav);
        });
        return list;
    }, [search, filterRole, filterStatus, sortField, sortDir]);

    const toggleSort = (field: keyof User) => {
        if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("asc"); }
    };

    const SortIcon = ({ field }: { field: keyof User }) =>
        sortField === field
            ? sortDir === "asc" ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />
            : <ChevronDown className="h-3 w-3 inline ml-1 opacity-30" />;

    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Users", value: USERS.length, color: "text-primary" },
                    { label: "Active", value: USERS.filter(u => u.is_active).length, color: "text-emerald-600 dark:text-emerald-400" },
                    { label: "Inactive", value: USERS.filter(u => !u.is_active).length, color: "text-amber-600 dark:text-amber-400" },
                ].map(({ label, value, color }) => (
                    <Card key={label} className="p-4">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className={cn("text-2xl font-bold mt-1", color)}>{value}</p>
                    </Card>
                ))}
            </div>

            {/* Toolbar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <div className="flex flex-1 gap-2 flex-wrap">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[180px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search users…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            {/* Role filter */}
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="text-sm rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="All">All Roles</option>
                                {["Admin", "Manager", "Cashier", "Viewer"].map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {/* Status filter */}
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="text-sm rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="All">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-4 w-4" />Export</Button>
                            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add User</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6 cursor-pointer" onClick={() => toggleSort("name")}>
                                    User <SortIcon field="name" />
                                </TableHead>
                                <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => toggleSort("roles")}>
                                    Role <SortIcon field="roles" />
                                </TableHead>
                                <TableHead className="hidden lg:table-cell">Contact</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => toggleSort("is_active")}>
                                    Status <SortIcon field="is_active" />
                                </TableHead>
                                <TableHead className="hidden xl:table-cell cursor-pointer" onClick={() => toggleSort("last_login_at")}>
                                    Last Login <SortIcon field="last_login_at" />
                                </TableHead>
                                <TableHead className="hidden xl:table-cell cursor-pointer" onClick={() => toggleSort("created_at")}>
                                    Joined <SortIcon field="created_at" />
                                </TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((user) => {
                                const statusKey = user.is_active ? "active" : "inactive";
                                const { label, variant, icon: StatusIcon } = statusConfig[statusKey];
                                const primaryRole = user.roles?.[0];
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white", primaryRole ? roleBg[primaryRole.name] || "bg-primary" : "bg-primary")}>
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", ROLES_DATA.find((r) => r.name === primaryRole?.name)?.color)}>
                                                {primaryRole?.name || "No Role"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="space-y-0.5">
                                                <p className="text-xs flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{user.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={variant} className="gap-1">
                                                <StatusIcon className="h-3 w-3" />{label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">{user.last_login_at || 'Never'}</TableCell>
                                        <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    {filtered.length === 0 && (
                        <div className="py-12 text-center text-sm text-muted-foreground">No users match your filters.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/* ─── Sub-component: Roles Tab ────────────────────────────────────── */
function RolesTab() {
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Role</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {ROLES_DATA.map((role) => (
                    <Card key={role.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", role.color)}>
                                    <Shield className="h-3.5 w-3.5" />{role.name}
                                </span>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-4">{role.description}</p>
                            <div className="flex gap-4 text-xs">
                                <div>
                                    <p className="text-muted-foreground">Users</p>
                                    <p className="font-semibold text-foreground mt-0.5">{role.users_count}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Permissions</p>
                                    <p className="font-semibold text-foreground mt-0.5">{role.permissions?.length || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

/* ─── Sub-component: Permissions Tab ──────────────────────────────── */
function PermissionsTab() {
    const roles = ["Admin", "Manager", "Cashier", "Viewer"];
    const perms: PermKey[] = ["view", "create", "edit", "delete"];

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Access Matrix</CardTitle>
                    <CardDescription>Permission breakdown per role across all modules</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/40">
                                <th className="px-6 py-3 text-left font-medium text-muted-foreground w-36">Module</th>
                                {roles.map((role) => (
                                    <th key={role} colSpan={4} className="px-2 py-3 text-center font-medium text-muted-foreground border-l">
                                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", ROLES_DATA.find(r => r.name === role)?.color)}>
                                            <Shield className="h-3 w-3" />{role}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                            <tr className="border-b bg-muted/20">
                                <td className="px-6 py-2 text-xs text-muted-foreground"></td>
                                {roles.map((role) =>
                                    perms.map((p) => (
                                        <td key={`${role}-${p}`} className="px-2 py-2 text-center text-[10px] font-medium text-muted-foreground capitalize border-l first:border-l-0">
                                            {p}
                                        </td>
                                    ))
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {MODULES.map((mod, i) => (
                                <tr key={mod} className={cn("border-b transition-colors hover:bg-muted/30", i % 2 === 0 && "bg-muted/10")}>
                                    <td className="px-6 py-3 font-medium text-foreground">{mod}</td>
                                    {roles.map((role) =>
                                        perms.map((perm) => {
                                            const has = PERMISSION_MATRIX[role][mod]?.includes(perm);
                                            return (
                                                <td key={`${role}-${perm}`} className="px-2 py-3 text-center border-l first:border-l-0">
                                                    {has
                                                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                                                        : <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                                                </td>
                                            );
                                        })
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Permission legend */}
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground font-medium mr-1">Legend:</span>
                {perms.map((p) => (
                    <span key={p} className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", PERM_COLORS[p])}>
                        {p}
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export function UserManagement() {
    const [activeTab, setActiveTab] = useState<Tab>("users");

    const tabs: { key: Tab; label: string }[] = [
        { key: "users", label: "Users" },
        { key: "roles", label: "Roles" },
        { key: "permissions", label: "Permissions" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">User Management</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage users, assign roles, and control access permissions.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5"><Filter className="h-4 w-4" />Filter</Button>
                    <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Invite User</Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
                {tabs.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={cn(
                            "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                            activeTab === key
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === "users" && <UsersTab />}
            {activeTab === "roles" && <RolesTab />}
            {activeTab === "permissions" && <PermissionsTab />}
        </div>
    );
}
