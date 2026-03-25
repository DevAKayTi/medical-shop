import { useEffect } from "react";
import { ShopSettings, storageLib } from "@/lib/storage";
import { authLib } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Store, ShieldAlert, Hash, AlertTriangle, FileText, Building2, Image } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/ToastProvider";
import api from "@/lib/api";

// ── Schemas ───────────────────────────────────────────────────────────────────

const shopProfileSchema = z.object({
    name: z.string().min(1, "Shop name is required."),
    email: z.string().email("Invalid email address."),
    phone: z.string().max(30).optional().or(z.literal("")),
    address: z.string().max(500).optional().or(z.literal("")),
    country: z.string().max(100).optional().or(z.literal("")),
    city: z.string().max(100).optional().or(z.literal("")),
    logo_url: z.string().url("Must be a valid URL").max(500).optional().or(z.literal("")),
});

const shopSettingsSchema = z.object({
    taxRate: z.coerce.number().min(0, "Tax Rate must be at least 0.").max(100),
    currencySymbol: z.string().min(1, "Currency Symbol is required."),
    invoicePrefix: z.string().min(1, "Invoice Prefix is required.").max(20),
    invoiceCounter: z.coerce.number().int().min(1, "Must be at least 1"),
    lowStockThreshold: z.coerce.number().int().min(0, "Must be at least 0"),
    receiptFooter: z.string().max(500).optional().default(""),
});

type ShopProfileValues = z.infer<typeof shopProfileSchema>;
type ShopSettingsValues = z.infer<typeof shopSettingsSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const toast = useToast();

    const profileForm = useForm<ShopProfileValues>({
        resolver: zodResolver(shopProfileSchema) as any,
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            address: "",
            country: "",
            city: "",
            logo_url: "",
        },
    });

    const settingsForm = useForm<ShopSettingsValues>({
        resolver: zodResolver(shopSettingsSchema) as any,
        defaultValues: {
            taxRate: 5.0,
            currencySymbol: "MMK",
            invoicePrefix: "INV-",
            invoiceCounter: 1,
            lowStockThreshold: 10,
            receiptFooter: "Thank you for your purchase!",
        },
    });

    useEffect(() => {
        loadFromApi();
    }, []);

    const loadFromApi = async () => {
        // Fast load from localStorage first
        const local = storageLib.getItem<ShopSettings>("shop_settings");
        if (local) {
            settingsForm.reset({
                taxRate: local.taxRate,
                currencySymbol: local.currencySymbol,
                invoicePrefix: local.invoicePrefix ?? "INV-",
                invoiceCounter: local.invoiceCounter ?? 1,
                lowStockThreshold: local.lowStockThreshold ?? 10,
                receiptFooter: local.receiptFooter ?? "",
            });
        }
        const localShop = storageLib.getShop();
        if (localShop) {
            profileForm.reset({
                name: localShop.name ?? "",
                email: localShop.email ?? "",
                phone: localShop.phone ?? "",
                address: localShop.address ?? "",
                country: localShop.country ?? "",
                city: localShop.city ?? "",
                logo_url: localShop.logo_url ?? "",
            });
        }

        // Then fetch fresh from API
        try {
            const res = await api.get('/shop');
            const shopData = res.data;
            const s = shopData.settings;

            profileForm.reset({
                name: shopData.name ?? "",
                email: shopData.email ?? "",
                phone: shopData.phone ?? "",
                address: shopData.address ?? "",
                country: shopData.country ?? "",
                city: shopData.city ?? "",
                logo_url: shopData.logo_url ?? "",
            });

            if (s) {
                const merged: ShopSettings = {
                    shopName: shopData.name,
                    taxRate: Number(s.tax_rate ?? 5),
                    currencySymbol: s.currency ?? "MMK",
                    invoicePrefix: s.invoice_prefix ?? "INV-",
                    invoiceCounter: Number(s.invoice_counter ?? 1),
                    lowStockThreshold: Number(s.low_stock_threshold ?? 10),
                    receiptFooter: s.receipt_footer ?? "",
                };
                settingsForm.reset({
                    taxRate: merged.taxRate,
                    currencySymbol: merged.currencySymbol,
                    invoicePrefix: merged.invoicePrefix,
                    invoiceCounter: merged.invoiceCounter,
                    lowStockThreshold: merged.lowStockThreshold,
                    receiptFooter: merged.receiptFooter,
                });
                storageLib.setItem("shop_settings", merged);
            }

            // Keep shop_info cache fresh
            storageLib.setShop(shopData);
        } catch {
            // Silently fallback to localStorage
        }
    };

    const handleSaveProfile = async (data: ShopProfileValues) => {
        try {
            const res = await api.put('/shop/profile', data);
            storageLib.setShop(res.data);
            toast.success("Shop profile updated successfully.");
        } catch (err: any) {
            const msg = err?.response?.data?.message
                || (err?.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(" ") : null)
                || "Failed to update shop profile.";
            toast.error(msg);
        }
    };

    const handleSaveSettings = async (data: ShopSettingsValues) => {
        // Update localStorage
        const existing = storageLib.getItem<ShopSettings>("shop_settings");
        storageLib.setItem("shop_settings", { ...existing, ...data, shopName: existing?.shopName ?? "" } as ShopSettings);

        try {
            await api.put('/shop/settings', {
                currency: data.currencySymbol,
                tax_rate: data.taxRate,
                invoice_prefix: data.invoicePrefix,
                invoice_counter: data.invoiceCounter,
                low_stock_threshold: data.lowStockThreshold,
                receipt_footer: data.receiptFooter || null,
            });
            toast.success("Shop settings saved successfully.");
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to save settings.";
            toast.error(msg);
        }
    };

    if (!authLib.hasPermission('read-settings')) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center space-y-4 rounded-md border border-dashed border-red-300 bg-red-50 text-center dark:border-red-900/50 dark:bg-red-900/10">
                <ShieldAlert className="h-10 w-10 text-red-500" />
                <h2 className="text-xl font-bold text-red-800 dark:text-red-200">Access Denied</h2>
                <p className="max-w-md text-red-600 dark:text-red-300">
                    You do not have permission to view Settings. Please contact your administrator.
                </p>
            </div>
        );
    }

    const pe = profileForm.formState.errors;
    const se = settingsForm.formState.errors;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Manage your shop profile and configuration.
                </p>
            </div>

            {/* ── Shop Profile Form ─────────────────────────────────────── */}
            <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-0">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <Building2 className="mr-2 h-5 w-5 text-emerald-500" />
                            Shop Profile
                        </CardTitle>
                        <CardDescription>Your business contact details shown on receipts and invoices.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Shop Name <span className="text-red-500">*</span></label>
                                <Input {...profileForm.register("name")} placeholder="My Medical Shop" className={pe.name ? 'border-red-500' : ''} />
                                {pe.name && <p className="text-red-500 text-xs">{pe.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                                <Input type="email" {...profileForm.register("email")} placeholder="shop@example.com" className={pe.email ? 'border-red-500' : ''} />
                                {pe.email && <p className="text-red-500 text-xs">{pe.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone</label>
                                <Input {...profileForm.register("phone")} placeholder="+95 9 123 456 789" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">City</label>
                                <Input {...profileForm.register("city")} placeholder="Yangon" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Country</label>
                                <Input {...profileForm.register("country")} placeholder="Myanmar" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-1.5">
                                    <Image className="h-3.5 w-3.5 text-slate-400" />
                                    Logo URL
                                </label>
                                <Input {...profileForm.register("logo_url")} placeholder="https://..." className={pe.logo_url ? 'border-red-500' : ''} />
                                {pe.logo_url && <p className="text-red-500 text-xs">{pe.logo_url.message}</p>}
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-medium">Address</label>
                                <textarea
                                    {...profileForm.register("address")}
                                    rows={2}
                                    placeholder="123 Main Street, Yangon"
                                    className="flex min-h-[60px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-slate-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none"
                                />
                            </div>
                        </div>

                        {authLib.hasPermission('manage-settings') && (
                            <div className="flex justify-end pt-2">
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8" disabled={profileForm.formState.isSubmitting}>
                                    {profileForm.formState.isSubmitting ? "Saving..." : "Save Profile"}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </form>

            {/* ── Shop Settings Form ────────────────────────────────────── */}
            <form onSubmit={settingsForm.handleSubmit(handleSaveSettings)} className="space-y-6">
                {/* Billing & Tax */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <Store className="mr-2 h-5 w-5 text-emerald-500" />
                            Billing & Tax
                        </CardTitle>
                        <CardDescription>Currency and global tax applied to all sales.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Currency Symbol</label>
                            <Input {...settingsForm.register("currencySymbol")} placeholder="MMK" className={se.currencySymbol ? 'border-red-500' : ''} />
                            {se.currencySymbol && <p className="text-red-500 text-xs">{se.currencySymbol.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Global Tax Rate (%)</label>
                            <Input type="number" step="0.01" min="0" max="100" {...settingsForm.register("taxRate")} className={se.taxRate ? 'border-red-500' : ''} />
                            {se.taxRate && <p className="text-red-500 text-xs">{se.taxRate.message}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <Hash className="mr-2 h-5 w-5 text-emerald-500" />
                            Invoice Settings
                        </CardTitle>
                        <CardDescription>Control how invoice numbers are generated.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Invoice Prefix</label>
                            <Input {...settingsForm.register("invoicePrefix")} placeholder="INV-" className={se.invoicePrefix ? 'border-red-500' : ''} />
                            {se.invoicePrefix && <p className="text-red-500 text-xs">{se.invoicePrefix.message}</p>}
                            <p className="text-xs text-slate-400">Example: <span className="font-mono">INV-0001</span></p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Invoice Counter (Start)</label>
                            <Input type="number" min="1" step="1" {...settingsForm.register("invoiceCounter")} className={se.invoiceCounter ? 'border-red-500' : ''} />
                            {se.invoiceCounter && <p className="text-red-500 text-xs">{se.invoiceCounter.message}</p>}
                            <p className="text-xs text-slate-400">Next invoice number to be issued.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Inventory & Receipt */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <AlertTriangle className="mr-2 h-5 w-5 text-emerald-500" />
                            Inventory & Receipt
                        </CardTitle>
                        <CardDescription>Low stock notifications and receipt footer text.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="sm:max-w-xs space-y-2">
                            <label className="text-sm font-medium">Low Stock Threshold</label>
                            <Input type="number" min="0" step="1" {...settingsForm.register("lowStockThreshold")} className={se.lowStockThreshold ? 'border-red-500' : ''} />
                            {se.lowStockThreshold && <p className="text-red-500 text-xs">{se.lowStockThreshold.message}</p>}
                            <p className="text-xs text-slate-400">Products at or below this quantity will show low-stock alerts.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-slate-400" />
                                Receipt Footer Message
                            </label>
                            <textarea
                                {...settingsForm.register("receiptFooter")}
                                rows={3}
                                placeholder="Thank you for your purchase!"
                                className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-slate-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none"
                            />
                            {se.receiptFooter && <p className="text-red-500 text-xs">{se.receiptFooter.message}</p>}
                            <p className="text-xs text-slate-400">Appears at the bottom of every printed receipt.</p>
                        </div>
                    </CardContent>
                </Card>

                {authLib.hasPermission('manage-settings') && (
                    <div className="flex justify-end">
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8" disabled={settingsForm.formState.isSubmitting}>
                            {settingsForm.formState.isSubmitting ? "Saving..." : "Save Configuration"}
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}
