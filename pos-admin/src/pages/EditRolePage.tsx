import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Shield, ChevronLeft, CheckCircle2, Loader2, Minus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";

type APIPermission = {
    id: string;
    name: string;
    slug: string;
    module: string;
};

/* ─── Role badge colour options ─── */
const COLOR_OPTIONS = [
    { label: "Red", value: "red", cls: "bg-red-500" },
    { label: "Violet", value: "violet", cls: "bg-violet-500" },
    { label: "Blue", value: "blue", cls: "bg-blue-500" },
    { label: "Teal", value: "teal", cls: "bg-teal-500" },
    { label: "Amber", value: "amber", cls: "bg-amber-500" },
    { label: "Slate", value: "slate", cls: "bg-slate-400" },
];

export function EditRolePage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [name, setName] = useState("");
    const [description, setDesc] = useState("");
    const [color, setColor] = useState("blue");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial loading state
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    // Permission state
    const [groupedPerms, setGroupedPerms] = useState<Record<string, APIPermission[]>>({});
    const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                // Fetch permissions and the specific role concurrently
                const [permsData, roleData] = await Promise.all([
                    apiClient("/permissions"),
                    apiClient(`/roles/${id}`)
                ]);

                // Group permissions by module
                const grouped = permsData.reduce((acc: any, perm: APIPermission) => {
                    const mod = perm.module || "General";
                    if (!acc[mod]) acc[mod] = [];
                    acc[mod].push(perm);
                    return acc;
                }, {} as Record<string, APIPermission[]>);
                setGroupedPerms(grouped);

                // Set role info
                setName(roleData.name || "");
                setDesc(roleData.description || "");

                // Simulate consistent colour assignment for edit mode, matching the RolesPage logic
                const hash = String(roleData.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const themeIndex = hash % COLOR_OPTIONS.length;
                setColor(COLOR_OPTIONS[themeIndex].value);

                // Extract currently assigned permissions
                if (roleData.permissions) {
                    setSelectedPermIds(roleData.permissions.map((p: any) => p.id));
                }

            } catch (err) {
                console.error("Failed to fetch data for edit", err);
                navigate("/roles");
            } finally {
                setIsLoadingInitial(false);
            }
        };

        fetchData();
    }, [id, navigate]);

    const togglePermission = (permId: string) => {
        setSelectedPermIds(prev =>
            prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
        );
    };

    const toggleModule = (module: string) => {
        const modulePerms = groupedPerms[module].map(p => p.id);
        const allSelected = modulePerms.every(permId => selectedPermIds.includes(permId));

        if (allSelected) {
            // Deselect all
            setSelectedPermIds(prev => prev.filter(permId => !modulePerms.includes(permId)));
        } else {
            // Select all
            setSelectedPermIds(prev => {
                const next = new Set(prev);
                modulePerms.forEach(permId => next.add(permId));
                return Array.from(next);
            });
        }
    };

    const getModuleState = (module: string): "all" | "some" | "none" => {
        const modulePerms = groupedPerms[module].map(p => p.id);
        if (modulePerms.length === 0) return "none";

        const selectedCount = modulePerms.filter(permId => selectedPermIds.includes(permId)).length;
        if (selectedCount === 0) return "none";
        if (selectedCount === modulePerms.length) return "all";
        return "some";
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = "Role name is required.";
        if (!description.trim()) e.description = "Description is required.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await apiClient(`/roles/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name,
                    description,
                    permissions: selectedPermIds,
                })
            });
            navigate("/roles");
        } catch (err: any) {
            console.error("Failed to update role", err);
            if (err.errors) {
                const backendErrors: Record<string, string> = {};
                if (err.errors.name) backendErrors.name = err.errors.name[0];
                if (err.errors.description) backendErrors.description = err.errors.description[0];
                setErrors(prev => ({ ...prev, ...backendErrors }));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingInitial) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
                <span className="text-muted-foreground">Loading role data...</span>
            </div>
        );
    }

    const selectedColor = COLOR_OPTIONS.find((c) => c.value === color)!;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/roles")} className="h-9 w-9">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Edit Role</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Modify role details and its access permissions.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ── Basic details ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Role Details</CardTitle>
                        <CardDescription>Update name, description, and badge colour.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                                Role Name <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => { setName(e.target.value); setErrors((err) => ({ ...err, name: "" })); }}
                                placeholder="e.g. Store Manager"
                                className={cn(
                                    "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                                    errors.name && "border-destructive ring-destructive/50"
                                )}
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                                Description <span className="text-destructive">*</span>
                            </label>
                            <textarea
                                rows={2}
                                value={description}
                                onChange={(e) => { setDesc(e.target.value); setErrors((err) => ({ ...err, description: "" })); }}
                                placeholder="Briefly describe what this role can do…"
                                className={cn(
                                    "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none",
                                    errors.description && "border-destructive ring-destructive/50"
                                )}
                            />
                            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                        </div>

                        {/* Colour picker */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Badge Colour</label>
                            <div className="flex flex-wrap gap-3">
                                {COLOR_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setColor(opt.value)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 text-xs font-semibold border-2 transition-all",
                                            color === opt.value
                                                ? "border-primary scale-105 shadow-md"
                                                : "border-transparent hover:border-muted-foreground/40"
                                        )}
                                    >
                                        <span className={cn("h-3.5 w-3.5 rounded-full", opt.cls)} />
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Color is assigned pseudo-randomly for display purposes and changes here won't persist to the DB.
                            </p>
                        </div>

                        {/* Preview badge */}
                        {name && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Preview:</span>
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white",
                                    selectedColor.cls
                                )}>
                                    <Shield className="h-3 w-3" />
                                    {name}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Permissions matrix ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Permissions</CardTitle>
                        <CardDescription>
                            Assign available system permissions to this role.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {Object.entries(groupedPerms).map(([module, modulePerms]) => (
                                <div key={module} className="border rounded-md overflow-hidden">
                                    <div
                                        className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => toggleModule(module)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                                                getModuleState(module) === "none" && "border-muted-foreground/30 bg-transparent",
                                                getModuleState(module) === "some" && "border-primary bg-primary/10 text-primary",
                                                getModuleState(module) === "all" && "border-primary bg-primary text-white"
                                            )}>
                                                {getModuleState(module) === "all" && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                {getModuleState(module) === "some" && <Minus className="h-3 w-3" />}
                                            </div>
                                            <h4 className="font-medium text-sm text-foreground">{module}</h4>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {modulePerms.filter(p => selectedPermIds.includes(p.id)).length} / {modulePerms.length}
                                        </span>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {modulePerms.map(perm => (
                                            <div
                                                key={perm.id}
                                                className="flex items-start gap-2.5 cursor-pointer group"
                                                onClick={() => togglePermission(perm.id)}
                                            >
                                                <div className={cn(
                                                    "flex h-4 w-4 shrink-0 translate-y-0.5 items-center justify-center rounded border transition-colors",
                                                    selectedPermIds.includes(perm.id)
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "border-input bg-transparent group-hover:border-primary/50"
                                                )}>
                                                    {selectedPermIds.includes(perm.id) && <CheckCircle2 className="h-3 w-3" />}
                                                </div>
                                                <div className="grid gap-0.5 leading-none">
                                                    <span className="text-sm font-medium leading-tight group-hover:text-primary transition-colors select-none">
                                                        {perm.name}
                                                    </span>
                                                    <span className="text-xs font-mono text-muted-foreground/70 select-none">
                                                        {perm.slug}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ── Actions ── */}
                <div className="flex justify-end gap-3 pb-6">
                    <Button type="button" variant="outline" onClick={() => navigate("/roles")}>
                        Cancel
                    </Button>
                    <Button type="submit" className="gap-2 min-w-[130px]" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
