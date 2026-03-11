import { NavLink, useNavigate } from "react-router-dom";
import { User, ShopInfo } from "@/lib/storage";
import { authLib } from "@/lib/auth";
import { LayoutDashboard, PackageSearch, Receipt, Users, BarChart3, Settings, LogOut, Store, MapPin, ShoppingCart, Clock, MonitorStop, TrendingUp } from "lucide-react";

interface SidebarProps {
    user: User;
    shop: ShopInfo | null;
}

export function Sidebar({ user, shop }: SidebarProps) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await authLib.logout();
        navigate("/login");
    };

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["Admin", "Manager", "Cashier"] },
        { name: "Inventory", href: "/dashboard/inventory", icon: PackageSearch, roles: ["Admin", "Manager"] },
        { name: "Purchases & Returns", href: "/dashboard/purchases", icon: ShoppingCart, roles: ["Admin", "Manager"] },
        { name: "Point of Sale (POS)", href: "/dashboard/pos", icon: MonitorStop, roles: ["Admin", "Manager", "Cashier"] },
        { name: "Sales History", href: "/dashboard/sales", icon: Receipt, roles: ["Admin", "Manager", "Cashier"] },
        { name: "Revenue Details", href: "/dashboard/revenue", icon: TrendingUp, roles: ["Admin", "Manager"] },
        { name: "Customers", href: "/dashboard/customers", icon: Users, roles: ["Admin", "Manager", "Cashier"] },
        { name: "Cash Registers", href: "/dashboard/registers", icon: Store, roles: ["Admin", "Manager"] },
        { name: "Shift History", href: "/dashboard/shifts", icon: Clock, roles: ["Admin", "Manager"] },
        { name: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ["Admin", "Manager"] },
        { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["Admin"] },
    ];

    // Filter items user has access to
    const visibleItems = navItems.filter(item => item.roles.includes(user.role));

    return (
        <div className="flex w-64 flex-col bg-slate-900 border-r border-slate-800 text-slate-300">
            {/* Shop Branding */}
            <div className="px-5 py-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white flex-shrink-0">
                        <Store className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white leading-tight">
                            {shop?.name ?? "Medical POS"}
                        </p>
                        {shop?.city && (
                            <p className="flex items-center gap-1 text-xs text-slate-400 truncate mt-0.5">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                {shop.city}
                            </p>
                        )}
                    </div>
                </div>

                {/* Shop status badge */}
                {shop && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center rounded-full bg-green-900/40 px-2 py-0.5 text-xs font-medium text-green-400 capitalize">
                            {shop.status}
                        </span>
                        {shop.settings?.currency && (
                            <span className="inline-flex items-center rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300">
                                {shop.settings.currency}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                    {visibleItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.href}
                                to={item.href}
                                end={item.href === "/dashboard"}
                                className={({ isActive }) =>
                                    `flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                    }`
                                }
                            >
                                <Icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                                {item.name}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            <div className="border-t border-slate-800 p-4">
                <div className="mb-4 px-2">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <span className="mt-1 inline-flex items-center rounded-full bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-300 capitalize">
                        {user.role}
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-slate-800 hover:text-red-300"
                >
                    <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                    Logout
                </button>
            </div>
        </div>
    );
}
