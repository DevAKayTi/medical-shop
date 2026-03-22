import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { storageLib, User, ShopInfo } from "@/lib/storage";
import { authLib } from "@/lib/auth";
import { shopLib } from "@/lib/shop";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { Menu } from "lucide-react";

export function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<User | null>(storageLib.getAuthUser());
    const [shop, setShop] = useState<ShopInfo | null>(storageLib.getShop());
    const [isVerifying, setIsVerifying] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close sidebar on route change (for mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        storageLib.init();

        const verifyAuth = async () => {
            const token = storageLib.getAuthToken();
            if (!token) {
                navigate("/login", { state: { from: location }, replace: true });
                return;
            }

            const currentUser = await authLib.me();
            if (currentUser) {
                setUser(currentUser);
                const shopInfo = await shopLib.fetchShop();
                if (shopInfo) setShop(shopInfo);
            } else {
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

    if (!user) return null;

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
            {/* Mobile backdrop overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar drawer */}
            <div
                className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <Sidebar user={user} shop={shop} onClose={() => setSidebarOpen(false)} />
            </div>

            <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                {/* Mobile top bar with hamburger */}
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 lg:hidden flex-shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        aria-label="Open sidebar"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate flex-1">
                        {shop?.name ?? "Medical POS"}
                    </span>
                    <NotificationBell />
                </div>

                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    {/* Desktop top bar with notification bell */}
                    <div className="hidden lg:flex items-center justify-end border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3">
                        <NotificationBell />
                    </div>
                    <div className="p-6">
                        <Outlet context={{ user, shop }} />
                    </div>
                </main>
            </div>
        </div>
    );
}
