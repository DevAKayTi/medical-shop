import { useState, useEffect } from "react";
import { Shield, CheckCircle2, XCircle, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";

/* ── Types ─────────────────────────────────────────────────── */
interface ApiPermission {
    id: string;
    name: string;
    slug: string;
    module: string | null;
    guard: string;
}

interface ApiRole {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    permissions: ApiPermission[];
    users_count?: number;
}

/* ── Helpers ────────────────────────────────────────────────── */
const getRoleColor = (str: string) => {
    const hash = String(str).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const classes = [
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
    ];
    return classes[hash % classes.length];
};

const getPermColor = (slug: string) => {
    if (slug.startsWith("create")) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (slug.startsWith("read")) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    if (slug.startsWith("update")) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    if (slug.startsWith("delete")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    return "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400";
};

/* ── Component ──────────────────────────────────────────────── */
export function PermissionsPage() {
    const [roles, setRoles] = useState<ApiRole[]>([]);
    const [allPermissions, setAllPermissions] = useState<ApiPermission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesData, permsData] = await Promise.all([
                    apiClient("/roles"),
                    apiClient("/permissions"),
                ]);
                setRoles(rolesData);
                setAllPermissions(permsData);
            } catch (err) {
                console.error("Failed to fetch permissions data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Derive unique modules from all permissions
    const modules = [...new Set(allPermissions.map(p => p.module || "General"))].sort();

    // Build a lookup: roleId -> Set of permission slugs
    const rolePermSlugs = (role: ApiRole) => new Set(role.permissions.map(p => p.slug));

    // Get permissions belonging to a module
    const modulePerms = (mod: string) =>
        allPermissions.filter(p => (p.module || "General") === mod);

    // Coverage = how many permissions a role has / total permissions
    const coverage = (role: ApiRole) => {
        if (allPermissions.length === 0) return 0;
        return Math.round((role.permissions.length / allPermissions.length) * 100);
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading permissions...</span>
            </div>
        );
    }

    if (roles.length === 0) {
        return (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground text-sm">
                No roles found. Please create roles first.
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">

            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Permissions</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Full access matrix — every role's permissions across all system modules.
                </p>
            </div>

            {/* Coverage summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {roles.map((role) => {
                    const pct = coverage(role);
                    return (
                        <Card key={role.id} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", getRoleColor(role.id))}>
                                    <Shield className="h-3 w-3" />{role.name}
                                </span>
                                <span className="text-xs font-bold">{pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">
                                {role.permissions.length}/{allPermissions.length} permissions
                            </p>
                        </Card>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground font-medium">Action Legend:</span>
                {[
                    { label: "Read", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
                    { label: "Create", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
                    { label: "Update", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
                    { label: "Delete", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
                ].map(({ label, cls }) => (
                    <span key={label} className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", cls)}>{label}</span>
                ))}
                <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                    <Info className="h-3.5 w-3.5" /> Rows = modules, columns = roles
                </span>
            </div>

            {/* Matrix — one table per module */}
            {modules.map(mod => {
                const perms = modulePerms(mod);
                if (perms.length === 0) return null;
                return (
                    <Card key={mod}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">{mod}</CardTitle>
                            <CardDescription>{perms.length} permission{perms.length > 1 ? "s" : ""} in this module</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="sticky left-0 bg-muted/30 px-6 py-3 text-left font-medium text-muted-foreground w-48 z-10 border-r">
                                            Permission
                                        </th>
                                        {roles.map(role => (
                                            <th key={role.id} className="px-4 py-3 text-center font-medium border-l">
                                                <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold", getRoleColor(role.id))}>
                                                    <Shield className="h-3 w-3" />{role.name}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {perms.map((perm, i) => (
                                        <tr key={perm.id} className={cn("border-b transition-colors hover:bg-muted/30", i % 2 === 0 && "bg-muted/10")}>
                                            <td className="sticky left-0 px-6 py-3 border-r z-10" style={{ backgroundColor: i % 2 === 0 ? "hsl(var(--muted)/0.1)" : "transparent" }}>
                                                <div>
                                                    <span className="font-medium text-foreground">{perm.name}</span>
                                                    <span className={cn("ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold", getPermColor(perm.slug))}>
                                                        {perm.slug.split("-")[0]}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-mono text-muted-foreground/70">{perm.slug}</span>
                                            </td>
                                            {roles.map(role => {
                                                const has = rolePermSlugs(role).has(perm.slug);
                                                return (
                                                    <td key={role.id} className="px-3 py-3 text-center border-l">
                                                        {has
                                                            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                                                            : <XCircle className="h-4 w-4 text-muted-foreground/25 mx-auto" />
                                                        }
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
