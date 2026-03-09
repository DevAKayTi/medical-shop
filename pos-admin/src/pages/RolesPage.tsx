import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Shield, Plus, Pencil, Trash2, Users, Key,
    CheckCircle2, ChevronRight, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { PermissionGuard } from "@/components/PermissionGuard";

import type { Role } from "@/types";

const ROLES: (Role & { color: string; iconColor: string; perms?: string[] })[] = [
    {
        id: "1", name: "Admin", slug: "admin", guard: "platform",
        description: "Full system access. Can manage all users, roles, settings and data across the entire platform.",
        users_count: 2, perms: [],
        color: "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10",
        iconColor: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        created_at: "", updated_at: ""
    },
    {
        id: "2", name: "Manager", slug: "manager", guard: "platform",
        description: "Manage sales, staff, and view reports. Cannot change core system settings or delete records.",
        users_count: 3, perms: [],
        color: "border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-900/10",
        iconColor: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
        created_at: "", updated_at: ""
    },
    {
        id: "3", name: "Cashier", slug: "cashier", guard: "platform",
        description: "Process orders and transactions. Limited to own shift data and point-of-sale operations only.",
        users_count: 3, perms: [],
        color: "border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10",
        iconColor: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        created_at: "", updated_at: ""
    },
    {
        id: "4", name: "Viewer", slug: "viewer", guard: "platform",
        description: "Read-only access to reports and dashboards. Cannot perform any write or delete operations.",
        users_count: 2, perms: [],
        color: "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20",
        iconColor: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
        created_at: "", updated_at: ""
    },
];

const SAMPLE_PERMS: Record<string, string[]> = {
    Admin: ["Full dashboard access", "Create & manage users", "Assign & revoke roles", "Configure system settings", "View all financial reports", "Delete any record", "Access API keys", "Manage integrations"],
    Manager: ["Dashboard overview", "Manage staff schedules", "View sales reports", "Edit product catalog", "Process refunds", "View customer data", "Manage promotions", "Export reports"],
    Cashier: ["Process orders", "View assigned products", "Issue receipts", "Apply discounts", "View own shift data", "Update order status"],
    Viewer: ["View dashboard", "View financial reports", "View analytics", "Export read-only data"],
};

export function RolesPage() {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState<string | null>(null);
    const [roles, setRoles] = useState<(Role & { color: string; iconColor: string; perms?: string[] })[]>(
        ROLES.map(r => ({ ...r, perms: SAMPLE_PERMS[r.name] }))
    );
    const [loading, setLoading] = useState(true);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const data = await apiClient("/roles");
            const mappedRoles = data.map((r: any) => {
                const colorThemes = [
                    { color: "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10", iconColor: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
                    { color: "border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-900/10", iconColor: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" },
                    { color: "border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10", iconColor: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
                    { color: "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10", iconColor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
                    { color: "border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10", iconColor: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
                    { color: "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20", iconColor: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400" },
                ];

                // Use a simple hash for color theme selection from the UUID string
                const hash = String(r.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const themeIndex = hash % colorThemes.length;
                const theme = colorThemes[themeIndex];
                const { color, iconColor } = theme;

                return {
                    ...r,
                    id: r.id,
                    name: r.name,
                    description: r.description || "No description provided.",
                    users_count: r.users_count || 0,
                    color,
                    iconColor,
                    perms: r.permissions ? r.permissions.map((p: any) => p.name) : []
                };
            });
            setRoles(mappedRoles);
        } catch (err) {
            console.error("Failed to fetch roles", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleDeleteRole = async (id: string, name: string, slug: string) => {
        if (["admin", "manager", "cashier", "viewer"].includes(slug)) {
            alert(`Cannot delete the system built-in ${name} role.`);
            return;
        }
        if (!confirm(`Are you sure you want to delete the ${name} role?`)) return;
        setLoading(true);
        try {
            await apiClient(`/roles/${id}`, { method: 'DELETE' });
            await fetchRoles();
        } catch (err) {
            console.error("Failed to delete role", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Roles</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Define what each role can access and do in the system.
                    </p>
                </div>
                <PermissionGuard permissions="create-role">
                    <Button
                        size="sm"
                        className="gap-1.5 w-fit"
                        onClick={() => navigate("/roles/create")}
                    >
                        <Plus className="h-4 w-4" />
                        Create Role
                    </Button>
                </PermissionGuard>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    Loading roles...
                </div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {roles.map((role) => (
                            <Card key={role.id} className="p-4">
                                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-2", role.iconColor)}>
                                    <Shield className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-semibold">{role.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{role.users_count || 0} users</p>
                            </Card>
                        ))}
                    </div>

                    {/* Role cards */}
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                        {roles.map((role) => (
                            <Card key={role.id} className={cn("border transition-all", role.color)}>
                                <CardHeader className="pb-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", role.iconColor)}>
                                                <Shield className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{role.name}</CardTitle>
                                                <p className="text-sm text-muted-foreground mt-0.5">{role.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <PermissionGuard permissions="update-role">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-transparent"
                                                    onClick={() => navigate(`/roles/edit/${role.id}`)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permissions="delete-role">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-transparent"
                                                    onClick={() => handleDeleteRole(role.id, role.name, role.slug)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </PermissionGuard>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    {/* Stats row */}
                                    <div className="flex gap-6 text-sm mb-4">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span><span className="font-semibold text-foreground">{role.users_count || 0}</span> users assigned</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Key className="h-4 w-4" />
                                            <span><span className="font-semibold text-foreground">{role.permissions?.length || 0}</span> permissions</span>
                                        </div>
                                    </div>

                                    {/* Permission preview / expand */}
                                    <button
                                        onClick={() => setExpanded(expanded === role.id ? null : role.id)}
                                        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                                    >
                                        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded === role.id && "rotate-90")} />
                                        {expanded === role.id ? "Hide permissions" : "View permissions"}
                                    </button>

                                    {expanded === role.id && role.perms && (
                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                            {role.perms.map((perm) => (
                                                <div key={perm} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                                    {perm}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
