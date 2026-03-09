import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Store, Save, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";

// ─── Field must be defined at MODULE level (outside the page component) ───────
// If defined inside, React recreates the component type on every render,
// causing each keystroke to unmount/remount the input and lose focus.
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
        <div className="space-y-1.5">
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
// ─────────────────────────────────────────────────────────────────────────────

export function CreateShopPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        country: "",
        city: "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await apiClient("/shops", {
                method: "POST",
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
                setErrors({ general: error.message || "Failed to create shop." });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/shops")}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Create New Shop</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Register a new medical shop on the platform.
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

                    {/* Shop Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Store className="h-4 w-4" /> Shop Details
                            </CardTitle>
                            <CardDescription>
                                Primary information about the medical shop.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Field
                                id="name"
                                label="Shop Name"
                                required
                                placeholder="e.g. City Pharmacy"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                            />
                            <Field
                                id="email"
                                label="Email Address"
                                required
                                type="email"
                                placeholder="info@citypharmacy.com"
                                value={formData.email}
                                onChange={handleChange}
                                error={errors.email}
                            />
                            <Field
                                id="phone"
                                label="Phone Number"
                                placeholder="+95 9 000 000 000"
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
                                <MapPin className="h-4 w-4" /> Location
                            </CardTitle>
                            <CardDescription>Where is this shop located?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="address">Address</Label>
                                <textarea
                                    id="address"
                                    name="address"
                                    rows={3}
                                    placeholder="123 Medical Street..."
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field
                                    id="city"
                                    label="City"
                                    placeholder="Yangon"
                                    value={formData.city}
                                    onChange={handleChange}
                                    error={errors.city}
                                />
                                <Field
                                    id="country"
                                    label="Country"
                                    placeholder="Myanmar"
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
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Save className="h-4 w-4" />
                        Create Shop
                    </Button>
                </div>
            </form>
        </div>
    );
}
