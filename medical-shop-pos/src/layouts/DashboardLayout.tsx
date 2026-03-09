import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { storageLib, User, ShopInfo } from "@/lib/storage";
import { authLib } from "@/lib/auth";
import { shopLib } from "@/lib/shop";
import { Sidebar } from "@/components/Sidebar";

export function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<User | null>(storageLib.getAuthUser());
    const [shop, setShop] = useState<ShopInfo | null>(storageLib.getShop());
    const [isVerifying, setIsVerifying] = useState(true);

    useEffect(() => {
        storageLib.init(); // Ensure localStorage structures exist

        const verifyAuth = async () => {
            const token = storageLib.getAuthToken();
            if (!token) {
                // No token, redirect immediately
                navigate("/login", { state: { from: location }, replace: true });
                return;
            }

            // Verify the token with the backend
            const currentUser = await authLib.me();
            if (currentUser) {
                setUser(currentUser);
                // Fetch the shop belonging to this user
                const shopInfo = await shopLib.fetchShop();
                if (shopInfo) {
                    setShop(shopInfo);
                }
            } else {
                // Token invalid or expired
                navigate("/login", { state: { from: location }, replace: true });
            }
            setIsVerifying(false);
        };

        verifyAuth();
    }, [navigate, location]);

    if (isVerifying) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
                <div className="text-slate-500">Loading...</div>
            </div>
        );
    }

    if (!user) return null; // Prevent flash of content logic

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
            <Sidebar user={user} shop={shop} />
            <div className="flex flex-1 flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
                    <Outlet context={{ user, shop }} />
                </main>
            </div>
        </div>
    );
}
