import { useState, useEffect } from "react";
import { ShopSettings, storageLib } from "@/lib/storage";
import { userApi, ApiUser } from "@/lib/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Store, ShieldAlert, Download, UserPlus, Trash2, RefreshCw, Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/ToastProvider";

const shopSettingsSchema = z.object({
    shopName: z.string().min(1, "Shop Name is required."),
    taxRate: z.coerce.number().min(0, "Tax Rate must be at least 0."),
    currencySymbol: z.string().min(1, "Currency Symbol is required."),
});

const userSchema = z.object({
    name: z.string().min(1, "Name is required."),
    email: z.string().email("Invalid email address."),
    phone: z.string().optional(),
    role: z.enum(["Admin", "Manager", "Cashier"]),
    password: z.string().optional(),
    password_confirmation: z.string().optional(),
}).refine((data) => {
    if (data.password || data.password_confirmation) {
        return data.password === data.password_confirmation;
    }
    return true;
}, {
    message: "Passwords do not match.",
    path: ["password_confirmation"],
});

type ShopSettingsValues = z.infer<typeof shopSettingsSchema>;
type UserFormValues = z.infer<typeof userSchema>;

// Role slug mapping for the backend
const ROLE_SLUGS: Record<string, string> = {
    Admin: "admin",
    Manager: "manager",
    Cashier: "staff",
};

export default function SettingsPage() {
    const toast = useToast();

    const {
        register: registerSettings,
        handleSubmit: handleSubmitSettings,
        reset: resetSettings,
        formState: { errors: settingsErrors },
    } = useForm<ShopSettingsValues>({
        resolver: zodResolver(shopSettingsSchema) as any,
        defaultValues: {
            shopName: "Medical Shop POS",
            taxRate: 5.0,
            currencySymbol: "MMK",
        },
    });

    const [users, setUsers] = useState<ApiUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    const {
        register: registerUser,
        handleSubmit: handleSubmitUser,
        reset: resetUser,
        formState: { errors: userErrors, isSubmitting: creating },
    } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            role: "Cashier",
            password: "",
            password_confirmation: "",
        },
    });

    const currentUser = storageLib.getAuthUser();

    useEffect(() => {
        loadSettings();
        fetchUsers();
    }, []);

    const loadSettings = () => {
        const s = storageLib.getItem<ShopSettings>("shop_settings");
        if (s) {
            resetSettings({
                shopName: s.shopName,
                taxRate: s.taxRate,
                currencySymbol: s.currencySymbol,
            });
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        setUsersError(null);
        try {
            const data = await userApi.list();
            setUsers(data);
        } catch (err: any) {
            setUsersError("Failed to load staff directory.");
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleSaveSettings = (data: ShopSettingsValues) => {
        storageLib.setItem("shop_settings", data);
        toast.success("Shop settings saved successfully.");
    };

    const handleSaveUser = async (data: UserFormValues) => {
        if (!editingUserId && !data.password) {
            setUserError("password", { type: "manual", message: "Password is required for new users." });
            return;
        }

        try {
            const payload: any = {
                ...data,
                phone: data.phone || undefined,
                role: ROLE_SLUGS[data.role] || "staff",
                is_active: true,
            };

            if (!payload.password) {
                delete payload.password;
                delete payload.password_confirmation;
            }

            if (editingUserId) {
                const updated = await userApi.update(editingUserId, payload);
                setUsers(prev => prev.map(u => u.id === editingUserId ? updated : u));
                setEditingUserId(null);
                resetUser({ name: "", email: "", phone: "", role: "Cashier", password: "", password_confirmation: "" });
                toast.success(`User "${updated.name}" updated successfully.`);
            } else {
                const created = await userApi.create(payload);
                setUsers(prev => [...prev, created]);
                resetUser({ name: "", email: "", phone: "", role: "Cashier", password: "", password_confirmation: "" });
                toast.success(`User "${created.name}" created successfully.`);
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message
                || (err?.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(" ") : null)
                || `Failed to ${editingUserId ? 'update' : 'create'} user.`;
            toast.error(msg);
        }
    };

    const handleEditUser = (user: ApiUser) => {
        setEditingUserId(user.id);
        const label = userApi.getRoleLabel(user.roles);
        resetUser({
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            role: (label as any) || "Cashier",
            password: "",
            password_confirmation: "",
        });
    };

    const cancelEdit = () => {
        setEditingUserId(null);
        resetUser({ name: "", email: "", phone: "", role: "Cashier", password: "", password_confirmation: "" });
    };

    const handleDeleteUser = async (user: ApiUser) => {
        if (user.id === currentUser?.id) {
            alert("You cannot delete your own account.");
            return;
        }
        if (!confirm(`Delete user "${user.name}"? This action cannot be undone.`)) return;

        try {
            await userApi.remove(user.id);
            setUsers(prev => prev.filter(u => u.id !== user.id));
            toast.success(`User "${user.name}" deleted.`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to delete user.");
        }
    };

    const handleExportBackup = () => {
        const backupData = {
            timestamp: new Date().toISOString(),
            shop_settings: storageLib.getItem("shop_settings"),
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `medical_pos_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getRoleBadge = (user: ApiUser) => {
        const label = userApi.getRoleLabel(user.roles);
        const colors: Record<string, string> = {
            Admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
            Manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
            Cashier: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        };
        return (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[label] || colors.Cashier}`}>
                {label}
            </span>
        );
    };

    if (currentUser?.role !== "Admin") {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center space-y-4 rounded-md border border-dashed border-red-300 bg-red-50 text-center dark:border-red-900/50 dark:bg-red-900/10">
                <ShieldAlert className="h-10 w-10 text-red-500" />
                <h2 className="text-xl font-bold text-red-800 dark:text-red-200">Access Denied</h2>
                <p className="max-w-md text-red-600 dark:text-red-300">
                    You do not have permission to view Settings. Only system Administrators can modify shop configurations.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Settings</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage your shop configuration, users, and data backups.
                    </p>
                </div>
                <Button variant="outline" onClick={handleExportBackup} className="flex-shrink-0 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-900/20">
                    <Download className="mr-2 h-4 w-4" /> Export Backup
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Shop Configuration */}
                <Card>
                    <form onSubmit={handleSubmitSettings(handleSaveSettings)}>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <Store className="mr-2 h-5 w-5 text-indigo-500" />
                                Shop Configuration
                            </CardTitle>
                            <CardDescription>Adjust global store attributes applied to receipts and totals.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Shop Name</label>
                                <Input
                                    {...registerSettings("shopName")}
                                    className={settingsErrors.shopName ? 'border-red-500' : ''}
                                />
                                {settingsErrors.shopName && <p className="text-red-500 text-xs">{settingsErrors.shopName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Global Tax Rate (%)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...registerSettings("taxRate")}
                                    className={settingsErrors.taxRate ? 'border-red-500' : ''}
                                />
                                {settingsErrors.taxRate && <p className="text-red-500 text-xs">{settingsErrors.taxRate.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Currency Symbol</label>
                                <Input
                                    {...registerSettings("currencySymbol")}
                                    className={settingsErrors.currencySymbol ? 'border-red-500' : ''}
                                />
                                {settingsErrors.currencySymbol && <p className="text-red-500 text-xs">{settingsErrors.currencySymbol.message}</p>}
                            </div>
                            <Button type="submit" className="mt-2 w-full">Save Configuration</Button>
                        </CardContent>
                    </form>
                </Card>

                {/* User Management */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <UserPlus className="mr-2 h-5 w-5 text-blue-500" />
                            User Management
                        </CardTitle>
                        <CardDescription>Add new POS operators or remove existing staff.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* User Form */}
                        <form onSubmit={handleSubmitUser(handleSaveUser)} className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                            <h4 className="text-sm font-medium">{editingUserId ? "Edit User" : "Add New User"}</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Input placeholder="Full Name" {...registerUser("name")} className={userErrors.name ? 'border-red-500' : ''} />
                                    {userErrors.name && <p className="text-red-500 text-xs mt-1">{userErrors.name.message}</p>}
                                </div>
                                <div>
                                    <Input placeholder="Email" type="email" {...registerUser("email")} className={userErrors.email ? 'border-red-500' : ''} />
                                    {userErrors.email && <p className="text-red-500 text-xs mt-1">{userErrors.email.message}</p>}
                                </div>
                                <div>
                                    <Input placeholder="Phone (optional)" {...registerUser("phone")} />
                                </div>
                                <div>
                                    <select
                                        {...registerUser("role")}
                                        className={`flex h-10 w-full rounded-md border ${userErrors.role ? 'border-red-500' : 'border-slate-300'} bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:text-slate-50`}
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Cashier">Cashier</option>
                                    </select>
                                    {userErrors.role && <p className="text-red-500 text-xs mt-1">{userErrors.role.message}</p>}
                                </div>
                                <div>
                                    <Input type="password" placeholder={editingUserId ? "Leave blank to keep current" : "Password"} {...registerUser("password")} className={userErrors.password ? 'border-red-500' : ''} />
                                    {userErrors.password && <p className="text-red-500 text-xs mt-1">{userErrors.password.message}</p>}
                                </div>
                                <div>
                                    <Input type="password" placeholder={editingUserId ? "Leave blank to keep current" : "Confirm Password"} {...registerUser("password_confirmation")} className={userErrors.password_confirmation ? 'border-red-500' : ''} />
                                    {userErrors.password_confirmation && <p className="text-red-500 text-xs mt-1">{userErrors.password_confirmation.message}</p>}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" size="sm" variant="secondary" className="flex-1" disabled={creating}>
                                    {creating ? "Saving..." : editingUserId ? "Update User" : "Create User"}
                                </Button>
                                {editingUserId && (
                                    <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>

                        {/* Active Staff Directory */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">Active Staff Directory</h4>
                                <Button variant="ghost" size="sm" onClick={fetchUsers} disabled={loadingUsers} className="h-7 text-xs text-slate-500">
                                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingUsers ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>

                            {usersError && (
                                <p className="text-xs text-red-500">{usersError}</p>
                            )}

                            <div className="divide-y divide-slate-200 rounded-md border border-slate-200 dark:divide-slate-800 dark:border-slate-800 max-h-[260px] overflow-y-auto">
                                {loadingUsers ? (
                                    <div className="py-6 flex items-center justify-center gap-2 text-sm text-slate-400">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
                                        Loading staff...
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="py-6 text-center text-sm text-slate-400">No staff members found.</div>
                                ) : (
                                    users.map(u => (
                                        <div key={u.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium leading-none truncate">{u.name}</p>
                                                    {getRoleBadge(u)}
                                                    {!u.is_active && (
                                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5 truncate">{u.email}</p>
                                            </div>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditUser(u)}
                                                    className="flex-shrink-0 h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                >
                                                    <Edit className="h-3.5 w-3.5 text-slate-500 hover:text-blue-500 dark:text-slate-400" />
                                                </Button>
                                                {u.id !== currentUser?.id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteUser(u)}
                                                        className="flex-shrink-0 h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{users.length} staff member{users.length !== 1 ? 's' : ''} registered.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
