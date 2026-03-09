import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = await apiClient("/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            localStorage.setItem("pos_access_token", data.token);
            localStorage.setItem("pos_user", JSON.stringify(data.user));

            await refreshUser();

            navigate("/");
        } catch (err: any) {
            setError(err.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <Lock className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Antigravity POS</h1>
                    <p className="mt-2 text-muted-foreground">Admin Dashboard Management</p>
                </div>

                <Card className="border-none shadow-xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl">Sign in</CardTitle>
                        <CardDescription>
                            Enter your credentials to access the POS admin
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 animate-in slide-in-from-top-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none" htmlFor="email">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="admin@pos.io"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium leading-none" htmlFor="password">
                                        Password
                                    </label>
                                    <a href="#" className="text-xs text-primary hover:underline">
                                        Forgot password?
                                    </a>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" size="lg" disabled={loading} type="submit">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Checking credentials...
                                    </>
                                ) : (
                                    "Log In"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <p className="mt-8 text-center text-xs text-muted-foreground">
                    &copy; 2026 Antigravity Systems. All rights reserved.
                </p>
            </div>
        </div>
    );
}
