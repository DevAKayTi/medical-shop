import * as React from "react";
import { useState, useEffect } from "react";
import { Settings, Save, Loader2, Store, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";

interface Shop {
    id: string;
    name: string;
}

interface ShopSettings {
    currency: string;
    tax_rate: number;
    invoice_prefix: string;
    invoice_counter: number;
    low_stock_threshold: number;
    timezone: string;
    receipt_footer: string;
}

export function ShopSettingsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [fetchingShops, setFetchingShops] = useState(true);
    const [fetchingSettings, setFetchingSettings] = useState(false);
    const [settings, setSettings] = useState<ShopSettings | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const response = await apiClient("/shops?per_page=100");
                setShops(response.data || []);
            } catch (error) {
                console.error("Failed to fetch shops", error);
            } finally {
                setFetchingShops(false);
            }
        };
        fetchShops();
    }, []);

    useEffect(() => {
        if (!selectedShopId) {
            setSettings(null);
            return;
        }

        const fetchSettings = async () => {
            setFetchingSettings(true);
            setSaveSuccess(false);
            setErrors({});
            try {
                const data = await apiClient(`/shops/${selectedShopId}/settings`);
                // Ensure numeric fields are numbers (API might return strings for decimals)
                setSettings({
                    ...data,
                    tax_rate: Number(data.tax_rate) || 0,
                    invoice_counter: Number(data.invoice_counter) || 1,
                    low_stock_threshold: Number(data.low_stock_threshold) || 0,
                });
            } catch (error) {
                console.error("Failed to fetch settings", error);
                setSettings(null);
            } finally {
                setFetchingSettings(false);
            }
        };
        fetchSettings();
    }, [selectedShopId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!settings) return;
        const { name, value } = e.target;
        setSettings({
            ...settings,
            [name]: ["tax_rate", "invoice_counter", "low_stock_threshold"].includes(name)
                ? Number(value)
                : value
        });
        setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedShopId || !settings) return;

        setLoading(true);
        setSaveSuccess(false);
        setErrors({});

        try {
            await apiClient(`/shops/${selectedShopId}/settings`, {
                method: "PUT",
                body: JSON.stringify(settings),
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error: any) {
            console.error("Failed to update settings", error);
            if (error.errors) {
                const flat: Record<string, string> = {};
                Object.entries(error.errors).forEach(([k, v]) => {
                    flat[k] = Array.isArray(v) ? (v[0] as string) : String(v);
                });
                setErrors(flat);
            } else {
                setErrors({ submit: error.message || "Failed to update settings" });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight">Shop Settings</h2>
                <p className="text-sm text-muted-foreground">
                    Configure regional, financial, and operational settings for each tenant shop.
                </p>
            </div>

            <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="py-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-base">Target Shop Selection</CardTitle>
                            <CardDescription>Choose a shop to view or modify its settings.</CardDescription>
                        </div>
                        <div className="w-[300px]">
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedShopId}
                                onChange={(e) => setSelectedShopId(e.target.value)}
                                disabled={fetchingShops}
                            >
                                <option value="" disabled>Select a shop...</option>
                                {shops.map((shop) => (
                                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {!selectedShopId ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/30">
                    <div className="bg-muted p-4 rounded-full mb-4">
                        <Settings className="h-10 w-10 text-muted-foreground opacity-50" />
                    </div>
                    <h3 className="font-semibold text-lg">No Shop Selected</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto mt-1">
                        Please select a shop from the dropdown above to manage its specific configurations.
                    </p>
                </div>
            ) : fetchingSettings ? (
                <div className="flex h-[40vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : settings ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {errors.submit && (
                        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex gap-3 items-center">
                            <AlertCircle className="h-5 w-5" />
                            <p className="text-sm font-medium">{errors.submit}</p>
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Financial & Regional */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    Financial & Regional
                                </CardTitle>
                                <CardDescription>Currency and tax configurations.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Base Currency</Label>
                                    <Input
                                        id="currency"
                                        name="currency"
                                        value={settings.currency}
                                        onChange={handleChange}
                                        placeholder="e.g. USD, THB"
                                        className={errors.currency ? "border-destructive" : ""}
                                    />
                                    {errors.currency && <p className="text-xs text-destructive">{errors.currency}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tax_rate">Default Tax Rate (%)</Label>
                                    <Input
                                        id="tax_rate"
                                        name="tax_rate"
                                        type="number"
                                        step="0.01"
                                        value={settings.tax_rate}
                                        onChange={handleChange}
                                        className={errors.tax_rate ? "border-destructive" : ""}
                                    />
                                    {errors.tax_rate && <p className="text-xs text-destructive">{errors.tax_rate}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <select
                                        id="timezone"
                                        name="timezone"
                                        value={settings.timezone}
                                        onChange={handleChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    >
                                        <option value="UTC">UTC</option>
                                        <option value="Asia/Bangkok">Asia/Bangkok (Thailand)</option>
                                        <option value="Asia/Singapore">Asia/Singapore</option>
                                        <option value="America/New_York">America/New_York</option>
                                        <option value="Europe/London">Europe/London</option>
                                    </select>
                                    {errors.timezone && <p className="text-xs text-destructive">{errors.timezone}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Inventory & Invoicing */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Inventory & Invoicing</CardTitle>
                                <CardDescription>Prefixes and stock thresholds.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
                                        <Input
                                            id="invoice_prefix"
                                            name="invoice_prefix"
                                            value={settings.invoice_prefix}
                                            onChange={handleChange}
                                            className={errors.invoice_prefix ? "border-destructive" : ""}
                                        />
                                        {errors.invoice_prefix && <p className="text-xs text-destructive">{errors.invoice_prefix}</p>}
                                    </div>
                                    <div className="w-1/3 space-y-2">
                                        <Label htmlFor="invoice_counter">Counter Start</Label>
                                        <Input
                                            id="invoice_counter"
                                            name="invoice_counter"
                                            type="number"
                                            value={settings.invoice_counter}
                                            onChange={handleChange}
                                            className={errors.invoice_counter ? "border-destructive" : ""}
                                        />
                                        {errors.invoice_counter && <p className="text-xs text-destructive">{errors.invoice_counter}</p>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="low_stock_threshold">Low Stock Alert Threshold</Label>
                                    <Input
                                        id="low_stock_threshold"
                                        name="low_stock_threshold"
                                        type="number"
                                        value={settings.low_stock_threshold}
                                        onChange={handleChange}
                                        className={errors.low_stock_threshold ? "border-destructive" : ""}
                                    />
                                    {errors.low_stock_threshold && <p className="text-xs text-destructive">{errors.low_stock_threshold}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* POS Customization */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base">POS Customization</CardTitle>
                                <CardDescription>Receipt appearance and customer-facing messages.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="receipt_footer">Receipt Footer Text</Label>
                                    <Textarea
                                        id="receipt_footer"
                                        name="receipt_footer"
                                        rows={4}
                                        value={settings.receipt_footer || ""}
                                        onChange={handleChange}
                                        placeholder="e.g. Thank you for shopping with us!"
                                        className={errors.receipt_footer ? "border-destructive" : ""}
                                    />
                                    {errors.receipt_footer && <p className="text-xs text-destructive">{errors.receipt_footer}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/20 border rounded-xl">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                            <Info className="h-4 w-4" />
                            Note: These changes take effect immediately in the shop's POS terminal.
                        </div>
                        <div className="flex items-center gap-3">
                            {saveSuccess && (
                                <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium animate-in fade-in slide-in-from-right-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Changes saved successfully!
                                </div>
                            )}
                            <Button type="submit" disabled={loading} className="gap-2 min-w-[140px]">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Settings
                            </Button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="p-8 text-center text-destructive">Failed to load shop settings. Please try again.</div>
            )}
        </div>
    );
}
