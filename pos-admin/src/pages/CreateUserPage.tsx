import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft, UserRound, Mail, Phone,
    Eye, EyeOff, Shield, CheckCircle2, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";

const STATUSES: { value: boolean; label: string; color: string }[] = [
    { value: true, label: "Active", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { value: false, label: "Inactive", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
];

const getRoleColor = (str: string) => {
    const hash = String(str).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
        "border-red-200 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50",
        "border-violet-200 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-900/50",
        "border-blue-200 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50",
        "border-teal-200 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-900/50",
        "border-amber-200 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50",
        "border-slate-200 bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700"
    ];
    return colors[hash % colors.length];
};

const AVATAR_COLORS = [
    { label: "Blue", cls: "bg-blue-500" },
    { label: "Violet", cls: "bg-violet-500" },
    { label: "Emerald", cls: "bg-emerald-500" },
    { label: "Red", cls: "bg-red-500" },
    { label: "Amber", cls: "bg-amber-500" },
    { label: "Slate", cls: "bg-slate-500" },
];

/* ─── helpers ─────────────────────────────────────────────────────── */
const initials = (name: string) =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

/* ─── Component ───────────────────────────────────────────────────── */
export function CreateUserPage() {
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState<string>("");
    const [availableRoles, setAvailableRoles] = useState<{ id: string, name: string, slug: string }[]>([]);
    const [status, setStatus] = useState<boolean>(true);
    const [avatarColor] = useState(() =>
        AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)].cls
    );
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fullName = `${firstName} ${lastName}`.trim();
    const avatarText = initials(fullName) || "?";

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await apiClient("/roles");
                setAvailableRoles(data);
                if (data.length > 0) {
                    setRole(data[0].slug); // Default to the first role found
                }
            } catch (err) {
                console.error("Failed to fetch roles:", err);
            }
        };
        fetchRoles();
    }, []);

    /* validation */
    const validate = () => {
        const e: Record<string, string> = {};
        if (!firstName.trim()) e.firstName = "First name is required.";
        if (!lastName.trim()) e.lastName = "Last name is required.";
        if (!email.trim()) e.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
        if (!password) e.password = "Password is required.";
        else if (password.length < 8) e.password = "Password must be at least 8 characters.";
        if (password !== confirmPassword) e.confirmPassword = "Passwords do not match.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const clear = (field: string) =>
        setErrors((prev) => ({ ...prev, [field]: "" }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await apiClient("/users", {
                method: "POST",
                body: JSON.stringify({
                    name: fullName,
                    email: email.trim(),
                    phone: phone.trim() || undefined,
                    password: password,
                    password_confirmation: confirmPassword,
                    role: role,
                    is_active: status,
                })
            });
            navigate("/users");
        } catch (err: any) {
            console.error("Failed to create user", err);
            if (err.errors) {
                // Map backend validation errors to frontend fields
                const backendErrors: Record<string, string> = {};
                if (err.errors.email) backendErrors.email = err.errors.email[0];
                if (err.errors.password) backendErrors.password = err.errors.password[0];
                if (err.errors.name) backendErrors.firstName = err.errors.name[0];
                setErrors(prev => ({ ...prev, ...backendErrors }));
            } else {
                setErrors(prev => ({ ...prev, email: "An unexpected error occurred." }));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/users")} className="h-9 w-9">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Create User</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Add a new system user and assign their role.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* ── Avatar preview ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Avatar</CardTitle>
                        <CardDescription>A random background colour has been assigned to the user's avatar.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-6">
                        {/* preview */}
                        <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white select-none shadow-inner", avatarColor)}>
                            {avatarText}
                        </div>
                        <div className="text-xs text-muted-foreground italic">
                            Color is assigned randomly and will not be stored.
                        </div>
                    </CardContent>
                </Card>

                {/* ── Personal info ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Name row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">
                                    First Name <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text" value={firstName} placeholder="John"
                                        onChange={(e) => { setFirstName(e.target.value); clear("firstName"); }}
                                        className={cn(
                                            "w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                                            errors.firstName && "border-destructive"
                                        )}
                                    />
                                </div>
                                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">
                                    Last Name <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text" value={lastName} placeholder="Doe"
                                        onChange={(e) => { setLastName(e.target.value); clear("lastName"); }}
                                        className={cn(
                                            "w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                                            errors.lastName && "border-destructive"
                                        )}
                                    />
                                </div>
                                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                                Email Address <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="email" value={email} placeholder="john@example.com"
                                    onChange={(e) => { setEmail(e.target.value); clear("email"); }}
                                    className={cn(
                                        "w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                                        errors.email && "border-destructive"
                                    )}
                                />
                            </div>
                            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="tel" value={phone} placeholder="+1 555-0100"
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Account settings ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Account Settings</CardTitle>
                        <CardDescription>Configure role, status, and initial password.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Role selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <div className="flex flex-wrap gap-2">
                                {availableRoles.length === 0 && (
                                    <span className="text-sm text-muted-foreground animate-pulse">Loading roles...</span>
                                )}
                                {availableRoles.map((r) => (
                                    <button
                                        key={r.id} type="button" onClick={() => setRole(r.slug)}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border-2 transition-all",
                                            getRoleColor(r.id),
                                            role === r.slug
                                                ? "border-current scale-105 shadow-sm"
                                                : "border-transparent opacity-60 hover:opacity-90"
                                        )}
                                    >
                                        <Shield className="h-3 w-3" />{r.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {STATUSES.map((s) => (
                                    <button
                                        key={String(s.value)} type="button" onClick={() => setStatus(s.value)}
                                        className={cn(
                                            "rounded-full px-3 py-1.5 text-xs font-semibold border-2 transition-all",
                                            s.color,
                                            status === s.value
                                                ? "border-current scale-105 shadow-sm"
                                                : "border-transparent opacity-60 hover:opacity-90"
                                        )}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                                Password <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={password} placeholder="Minimum 8 characters"
                                    onChange={(e) => { setPassword(e.target.value); clear("password"); }}
                                    className={cn(
                                        "w-full pr-10 pl-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                                        errors.password && "border-destructive"
                                    )}
                                />
                                <button
                                    type="button" onClick={() => setShowPass((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {/* strength bar */}
                            <div className="flex gap-1 mt-1">
                                {[8, 12, 16].map((len, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-1 flex-1 rounded-full transition-colors",
                                            password.length >= len
                                                ? i === 0 ? "bg-amber-400" : i === 1 ? "bg-blue-500" : "bg-emerald-500"
                                                : "bg-muted"
                                        )}
                                    />
                                ))}
                            </div>
                            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                                Confirm Password <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPass ? "text" : "password"}
                                    value={confirmPassword} placeholder="Re-enter password"
                                    onChange={(e) => { setConfirmPassword(e.target.value); clear("confirmPassword"); }}
                                    className={cn(
                                        "w-full pr-10 pl-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                                        errors.confirmPassword && "border-destructive"
                                    )}
                                />
                                <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center pr-2 border-r focus-within:border-ring">
                                    {password === confirmPassword && confirmPassword !== "" && (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-in zoom-in duration-300" />
                                    )}
                                    {password !== confirmPassword && confirmPassword !== "" && (
                                        <XCircle className="h-4 w-4 text-destructive animate-in zoom-in duration-300" />
                                    )}
                                </div>
                                <button
                                    type="button" onClick={() => setShowConfirmPass((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {password === confirmPassword && confirmPassword !== "" && (
                                <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Passwords match
                                </p>
                            )}
                            {password !== confirmPassword && confirmPassword !== "" && (
                                <p className="text-[10px] font-medium text-destructive mt-1 flex items-center gap-1">
                                    <XCircle className="h-3 w-3" /> Passwords do not match
                                </p>
                            )}
                            {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* ── Preview row ── */}
                {fullName && (
                    <Card className="border-dashed">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white", avatarColor)}>
                                {avatarText}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{fullName}</p>
                                {email && <p className="text-xs text-muted-foreground truncate">{email}</p>}
                            </div>
                            {role && (
                                <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shrink-0 border", getRoleColor(availableRoles.find(r => r.slug === role)?.id || ""))}>
                                    <Shield className="h-3 w-3" />
                                    {availableRoles.find(r => r.slug === role)?.name || role}
                                </span>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ── Actions ── */}
                <div className="flex justify-end gap-3 pb-6">
                    <Button type="button" variant="outline" onClick={() => navigate("/users")} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" className="gap-2 min-w-[130px]" disabled={isSubmitting}>
                        {isSubmitting ? <span className="animate-spin mr-1">⏳</span> : <UserRound className="h-4 w-4" />}
                        {isSubmitting ? "Creating..." : "Create User"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
