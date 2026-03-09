import { useState, useEffect } from "react";
import { User, ShopSettings, storageLib } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Store, ShieldAlert, Download, UserPlus, Trash2 } from "lucide-react";

export default function SettingsPage() {
    const [settings, setSettings] = useState<ShopSettings>({
        shopName: "Medical Shop POS",
        taxRate: 5.0,
        currencySymbol: "$",
    });

    const [users, setUsers] = useState<User[]>([]);
    const [newUser, setNewUser] = useState({ name: "", email: "", role: "Cashier", password: "" });
    const [successMsg, setSuccessMsg] = useState("");

    const currentUser = storageLib.getAuthUser();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = () => {
        const s = storageLib.getItem<ShopSettings>("shop_settings");
        if (s) setSettings(s);

        // Only Admin should manage users, but route guards should protect this page anyway
        const us = storageLib.getItem<User[]>("users") || [];
        setUsers(us);
    };

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        storageLib.setItem("shop_settings", settings);
        showSuccess("Shop settings saved successfully.");
    };

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.name || !newUser.email || !newUser.password) return;

        const newU: User = {
            id: `user-${Date.now()}`,
            name: newUser.name,
            email: newUser.email,
            roles: [{ name: newUser.role, slug: newUser.role.toLowerCase() }],
            role: newUser.role as any,
        };

        const updatedUsers = [...users, newU];
        storageLib.setItem("users", updatedUsers);
        setUsers(updatedUsers);
        setNewUser({ name: "", email: "", role: "Cashier", password: "" });
        showSuccess("User added successfully.");
    };

    const handleDeleteUser = (id: string) => {
        if (id === currentUser?.id) {
            alert("You cannot delete your own active session account.");
            return;
        }
        if (confirm("Are you sure you want to delete this user?")) {
            const updatedUsers = users.filter(u => u.id !== id);
            storageLib.setItem("users", updatedUsers);
            setUsers(updatedUsers);
            showSuccess("User deleted.");
        }
    };

    const handleExportBackup = () => {
        const backupData = {
            timestamp: new Date().toISOString(),
            shop_settings: storageLib.getItem("shop_settings"),
            users: storageLib.getItem("users"),
            products: storageLib.getItem("products"),
            customers: storageLib.getItem("customers"),
            sales: storageLib.getItem("sales"),
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

    if (currentUser?.role !== "Admin") {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center space-y-4 rounded-md border border-dashed border-red-300 bg-red-50 text-center dark:border-red-900/50 dark:bg-red-900/10">
                <ShieldAlert className="h-10 w-10 text-red-500" />
                <h2 className="text-xl font-bold text-red-800 dark:text-red-200">Access Denied</h2>
                <p className="max-w-md text-red-600 dark:text-red-300">
                    You do not have permission to view Settings. Only system Administrators can modify shop configurations and security properties.
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

            {successMsg && (
                <div className="rounded-md bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                    <p className="text-sm font-medium">{successMsg}</p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Shop Configuration */}
                <Card>
                    <form onSubmit={handleSaveSettings}>
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
                                    value={settings.shopName}
                                    onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Global Tax Rate (%)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={settings.taxRate}
                                    onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Currency Symbol</label>
                                <Input
                                    value={settings.currencySymbol}
                                    onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                                    required
                                />
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
                        <form onSubmit={handleAddUser} className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                            <h4 className="text-sm font-medium mb-3">Add New User</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Input placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
                                </div>
                                <div className="space-y-1">
                                    <Input placeholder="Email" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                                </div>
                                <div className="space-y-1">
                                    <Input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                                </div>
                                <div className="space-y-1">
                                    <select
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:text-slate-50"
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Cashier">Cashier</option>
                                    </select>
                                </div>
                            </div>
                            <Button type="submit" size="sm" variant="secondary" className="w-full">Create User</Button>
                        </form>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Active Staff Directory</h4>
                            <div className="divide-y divide-slate-200 rounded-md border border-slate-200 dark:divide-slate-800 dark:border-slate-800 max-h-[200px] overflow-y-auto">
                                {users.map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-3">
                                        <div>
                                            <p className="text-sm font-medium leading-none">{u.name}</p>
                                            <p className="text-xs text-slate-500">{u.role} ({u.email})</p>
                                        </div>
                                        {u.id !== currentUser?.id && (
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
