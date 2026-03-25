import { useState, useEffect } from "react";
import { authLib } from "@/lib/auth";
import { userApi, ApiUser } from "@/lib/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserPlus, ShieldAlert, Trash2, RefreshCw, Edit } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm } from "@/hooks/useConfirm";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { storageLib } from "@/lib/storage";

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

type UserFormValues = z.infer<typeof userSchema>;

// Role slug mapping for the backend
const ROLE_SLUGS: Record<string, string> = {
    Admin: "admin",
    Manager: "manager",
    Cashier: "staff",
};

export default function StaffPage() {
    const toast = useToast();
    const [ConfirmDialog, confirm] = useConfirm();

    const [users, setUsers] = useState<ApiUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    const {
        register: registerUser,
        control: controlUser,
        handleSubmit: handleSubmitUser,
        reset: resetUser,
        setError: setUserError,
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
        fetchUsers();
    }, []);

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
                setUsers((prev: any) => prev.map((u: any) => u.id === editingUserId ? updated : u));
                setEditingUserId(null);
                resetUser({ name: "", email: "", phone: "", role: "Cashier", password: "", password_confirmation: "" });
                toast.success(`User "${updated.name}" updated successfully.`);
            } else {
                const created = await userApi.create(payload);
                setUsers((prev: any) => [...prev, created]);
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
            toast.error("You cannot delete your own account.");
            return;
        }

        const isConfirmed = await confirm({
            title: "Delete User?",
            description: `Delete user "${user.name}"? This action cannot be undone.`,
            confirmText: "Yes, Delete User",
            variant: "destructive"
        });
        if (!isConfirmed) return;

        try {
            await userApi.remove(user.id);
            setUsers(prev => prev.filter(u => u.id !== user.id));
            toast.success(`User "${user.name}" deleted.`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to delete user.");
        }
    };

    const getRoleBadge = (user: ApiUser) => {
        const label = userApi.getRoleLabel(user.roles);
        const colors: Record<string, string> = {
            Admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
            Manager: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
            Cashier: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        };
        return (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[label] || colors.Cashier}`}>
                {label}
            </span>
        );
    };

    if (!authLib.hasPermission('read-users')) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center space-y-4 rounded-md border border-dashed border-red-300 bg-red-50 text-center dark:border-red-900/50 dark:bg-red-900/10">
                <ShieldAlert className="h-10 w-10 text-red-500" />
                <h2 className="text-xl font-bold text-red-800 dark:text-red-200">Access Denied</h2>
                <p className="max-w-md text-red-600 dark:text-red-300">
                    You do not have permission to view Staff records. Please contact your administrator.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Staff Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 sm:mt-0">
                        Add new POS operators or remove existing staff.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <UserPlus className="mr-2 h-5 w-5 text-emerald-500" />
                            {editingUserId ? "Edit User" : "Add New User"}
                        </CardTitle>
                        <CardDescription>{editingUserId ? "Update existing staff details." : "Register a new staff member."}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {((!editingUserId && authLib.hasPermission('create-users')) || (editingUserId && authLib.hasPermission('update-users'))) && (
                            <form onSubmit={handleSubmitUser(handleSaveUser)} className="">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="sm:col-span-2">
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
                                    <div className="sm:col-span-2">
                                        <Controller
                                            name="role"
                                            control={controlUser}
                                            render={({ field }) => (
                                                <SelectMenu
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    options={[
                                                        { value: "Admin", label: "Admin" },
                                                        { value: "Manager", label: "Manager" },
                                                        { value: "Cashier", label: "Cashier" },
                                                    ]}
                                                    className={userErrors.role ? 'border-red-500 ring-red-500 ring-2' : ''}
                                                />
                                            )}
                                        />
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
                                <div className="flex gap-2 mt-4">
                                    <Button type="submit" size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={creating}>
                                        {creating ? "Saving..." : editingUserId ? "Update User" : "Create User"}
                                    </Button>
                                    {editingUserId && (
                                        <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-1">
                    <CardHeader>
                        <div className="flex justify-between">
                            <div>
                                <CardTitle>Active Staff Directory</CardTitle>
                                <CardDescription>View and manage all registered staff.</CardDescription>
                            </div>
                            <div className="flex justify-end">
                                <Button variant="ghost" size="sm" onClick={fetchUsers} disabled={loadingUsers} className="w-full sm:w-auto h-7 text-xs text-slate-500 bg-slate-100 sm:bg-transparent dark:bg-slate-800 sm:dark:bg-transparent">
                                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingUsers ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>

                            {usersError && (
                                <p className="text-xs text-red-500">{usersError}</p>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="divide-y divide-slate-200 rounded-md border border-slate-200 dark:divide-slate-800 dark:border-slate-800 max-h-[400px] overflow-y-auto">
                                {loadingUsers ? (
                                    <div className="py-8 flex items-center justify-center gap-2 text-sm text-slate-400">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
                                        Loading staff...
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="py-8 text-center text-sm text-slate-400">No staff members found.</div>
                                ) : (
                                    users.map(u => (
                                        <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors gap-2">
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
                                                <p className="text-xs text-slate-500 mt-1 truncate">{u.email}</p>
                                                {u.phone && <p className="text-xs text-slate-400 mt-0.5">{u.phone}</p>}
                                            </div>
                                            <div className="flex items-center justify-end space-x-1 sm:flex-shrink-0 mt-2 sm:mt-0">
                                                {authLib.hasPermission('update-users') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditUser(u)}
                                                    >
                                                        <Edit className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                )}
                                                {authLib.hasPermission('delete-users') && u.id !== currentUser?.id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteUser(u)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
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

            <ConfirmDialog />
        </div>
    );
}
