import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Store, Save, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";

interface FieldProps {
    id: string;
    label: string;
    required?: boolean;
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

export function EditShopPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        country: "",
        city: "",
    });

    useEffect(() => {
        const fetchShop = async () => {
            try {
                const data = await apiClient(`/shops/${id}`);
                setFormData({
                    name: data.name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    country: data.country || "",
                    city: data.city || "",
                });
            } catch (error) {
                console.error("Failed to fetch shop details", error);
                setErrors({ general: "Failed to load shop details." });
            } finally {
                setFetching(false);
            }
        };

        if (id) {
            fetchShop();
        }
    }, [id]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await apiClient(`/shops/${id}`, {
                method: "PUT",
                body: JSON.stringify(formData),
            });
            navigate("/shops");
        } catch (error: any) {
            if (error.errors) {
                const flat: Record<string, string> = {};
                Object.entries(error.errors).forEach(([k, v]) => {
                    flat[k] = Array.isArray(v) ? (v[0] as string) : String(v);
                });
                setErrors(flat);
            } else {
                setErrors({ general: error.message || "Failed to update shop." });
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
                <Button variant="ghost" size="icon" onClick={() => navigate("/shops")}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Edit Shop</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Update tenant shop details.
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

                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Store className="h-4 w-4" /> Basic Information
                            </CardTitle>
                            <CardDescription>
                                Identity and primary contact for this shop.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Field
                                id="name"
                                label="Shop Name"
                                required
                                placeholder="e.g. Downtown Cafe"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                            />
                            <Field
                                id="email"
                                label="Business Email"
                                required
                                type="email"
                                placeholder="contact@shop.com"
                                value={formData.email}
                                onChange={handleChange}
                                error={errors.email}
                            />
                            <Field
                                id="phone"
                                label="Phone Number"
                                placeholder="+1 234 567 890"
                                value={formData.phone}
                                onChange={handleChange}
                                error={errors.phone}
                            />
                        </CardContent>
                    </Card>

                    {/* Location */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MapPin className="h-4 w-4" /> Location Details
                            </CardTitle>
                            <CardDescription>
                                Physical address of the business.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Field
                                id="address"
                                label="Street Address"
                                placeholder="123 Main St, Suite 100"
                                value={formData.address}
                                onChange={handleChange}
                                error={errors.address}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    id="city"
                                    label="City"
                                    placeholder="New York"
                                    value={formData.city}
                                    onChange={handleChange}
                                    error={errors.city}
                                />
                                <Field
                                    id="country"
                                    label="Country"
                                    placeholder="United States"
                                    value={formData.country}
                                    onChange={handleChange}
                                    error={errors.country}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => navigate("/shops")}
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
