import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Save, Loader2, Store, UserRound } from "lucide-react";
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

export function EditShopUserPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
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
        role_slug: "",
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all active shops to assign users to
                const shopsData = await apiClient("/shops?per_page=100");
                setShops(shopsData.data || []);
            } catch (error) {
                console.error("Failed to fetch shops", error);
            } finally {
                setFetchingShops(false);
            }

            if (id) {
                try {
                    const userData = await apiClient(`/shop-users/${id}`);
                    setFormData({
                        shop_id: userData.shop_id || "",
                        name: userData.name || "",
                        email: userData.email || "",
                        role_slug: userData.role?.slug || "",
                    });
                } catch (error) {
                    console.error("Failed to fetch shop user details", error);
                    setErrors({ general: "Failed to load shop user details." });
                } finally {
                    setFetching(false);
                }
            }
        };
        fetchData();
    }, [id]);

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
            await apiClient(`/shop-users/${id}`, {
                method: "PUT",
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
                setErrors({ general: error.message || "Failed to update shop user." });
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/staffs")}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Edit Shop User</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Update details and access level for a tenant shop user.
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
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
