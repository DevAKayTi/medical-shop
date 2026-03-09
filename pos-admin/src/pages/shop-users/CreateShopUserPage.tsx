import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Save, Loader2, Store, UserRound, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";

interface Shop {
    id: string;
    name: string;
}

interface FieldProps {
    id: string;
    label: string;
    required?: boolean;
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    error?: string;
}

function Field({ id, label, required, type = "text", placeholder, value, onChange, error }: FieldProps) {
    return (
        <div className="space-y-1.5 ">
            <Label htmlFor={id}>
                {label} {required && <span className="text-destructive">*</span>}
            </Label>
            <Input
                id={id}
                name={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

export function CreateShopUserPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [shops, setShops] = useState<Shop[]>([]);
    const [fetchingShops, setFetchingShops] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Role selection options
    const roles = [
        { id: "admin", name: "Shop Admin (Full Access)" },
        { id: "manager", name: "Shop Manager (Operations Access)" },
        { id: "staff", name: "Shop Staff (POS & Sales Access)" },
    ];

    const [formData, setFormData] = useState({
        shop_id: "",
        name: "",
        email: "",
        password: "",
        role_slug: "",
    });

    useEffect(() => {
        const fetchShops = async () => {
            try {
                // Fetch all active shops to assign users to
                const data = await apiClient("/shops?per_page=100");
                setShops(data.data || []);
            } catch (error) {
                console.error("Failed to fetch shops", error);
            } finally {
                setFetchingShops(false);
            }
        };
        fetchShops();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await apiClient("/shop-users", {
                method: "POST",
                body: JSON.stringify(formData),
            });
            navigate("/staffs");
        } catch (error: any) {
            if (error.errors) {
                const flat: Record<string, string> = {};
                Object.entries(error.errors).forEach(([k, v]) => {
                    flat[k] = Array.isArray(v) ? (v[0] as string) : String(v);
                });
                setErrors(flat);
            } else {
                setErrors({ general: error.message || "Failed to create shop user." });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/staffs")}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Create Shop User</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Add a new staff, manager, or owner to a tenant shop.
                    </p>
                </div>
            </div>

            {errors.general && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {errors.general}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">

                    {/* User Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <UserRound className="h-4 w-4" /> Personal Details
                            </CardTitle>
                            <CardDescription>
                                Identity and layout information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Field
                                id="name"
                                label="Full Name"
                                required
                                placeholder="e.g. John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                            />
                            <Field
                                id="email"
                                label="Email Address"
                                required
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                error={errors.email}
                            />
                            <div className="space-y-1.5">
                                <Label htmlFor="password">
                                    Password <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="Min. 8 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className={`pl-9 ${errors.password ? "border-destructive" : ""}`}
                                    />
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-destructive">{errors.password}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assignment */}
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Store className="h-4 w-4" /> Shop Assignment
                            </CardTitle>
                            <CardDescription>
                                Which shop and what access level?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1">
                            <div className="space-y-1.5">
                                <Label htmlFor="shop_id">
                                    Target Shop <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="shop_id"
                                    name="shop_id"
                                    value={formData.shop_id}
                                    onChange={handleChange}
                                    required
                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${errors.shop_id ? "border-destructive" : "border-input"
                                        }`}
                                >
                                    <option value="" disabled>
                                        {fetchingShops ? "Loading shops..." : "Select a shop..."}
                                    </option>
                                    {shops.map((shop) => (
                                        <option key={shop.id} value={shop.id}>
                                            {shop.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.shop_id && (
                                    <p className="text-xs text-destructive">{errors.shop_id}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="role_slug">
                                    Role <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="role_slug"
                                    name="role_slug"
                                    value={formData.role_slug}
                                    onChange={handleChange}
                                    required
                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${errors.role_slug ? "border-destructive" : "border-input"
                                        }`}
                                >
                                    <option value="" disabled>Select a role...</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.role_slug && (
                                    <p className="text-xs text-destructive">{errors.role_slug}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => navigate("/staffs")}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="gap-2">
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Create User
                    </Button>
                </div>
            </form>
        </div>
    );
}
