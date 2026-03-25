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
        <div className="flex h-screen bg-gray-100 dark:bg-slate-900">
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
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
                    {/* Mobile top bar with hamburger */}
                    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-4 py-3 lg:hidden">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            aria-label="Open sidebar"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate flex-1">
                            {shop?.name ?? "Medical POS"}
                        </span>

                        <NotificationBell />
                    </div>

                    {/* Desktop top bar with notification bell */}
                    <div className="sticky top-0 z-10 hidden lg:flex shrink-0 items-center justify-end border-b border-slate-200/60 dark:border-slate-800/60 bg-white/75 dark:bg-slate-900/70 backdrop-blur-sm px-6 py-3">
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
