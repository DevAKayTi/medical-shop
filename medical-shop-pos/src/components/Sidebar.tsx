import { NavLink, useNavigate } from "react-router-dom";
import { User, ShopInfo } from "@/lib/storage";
import { authLib } from "@/lib/auth";
import { LayoutDashboard, PackageSearch, Receipt, Users, BarChart3, Settings, LogOut, Store, MapPin, ShoppingCart, Clock, MonitorStop, TrendingUp, History, UserCog } from "lucide-react";
import mediPosLogo from "@/assets/medi_pos_logo.png";

interface SidebarProps {
    user: User;
    shop: ShopInfo | null;
    onClose?: () => void;
}

export function Sidebar({ user, shop, onClose }: SidebarProps) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await authLib.logout();
        navigate("/login");
    };

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "view-dashboard" },
        { name: "Inventory", href: "/dashboard/inventory", icon: PackageSearch, permission: "read-catalog" },
        { name: "Purchases & Returns", href: "/dashboard/purchases", icon: ShoppingCart, permission: "read-purchases" },
        { name: "Point of Sale (POS)", href: "/dashboard/pos", icon: MonitorStop, permission: "create-sales" },
        { name: "Sales History", href: "/dashboard/sales", icon: Receipt, permission: "read-sales" },
        { name: "Revenue Details", href: "/dashboard/revenue", icon: TrendingUp, permission: "view-reports" }, // Needs view-reports
        { name: "Customers", href: "/dashboard/customers", icon: Users, permission: "read-customers" },
        { name: "Cash Registers", href: "/dashboard/registers", icon: Store, permission: "read-registers" },
        { name: "Shift History", href: "/dashboard/shifts", icon: Clock, permission: "read-shifts" },
        { name: "Activity Log", href: "/dashboard/activity-logs", icon: History, permission: "view-dashboard" },
        { name: "Staff", href: "/dashboard/staff", icon: UserCog, permission: "read-users" },
        { name: "Reports", href: "/dashboard/reports", icon: BarChart3, permission: "view-reports" },
        { name: "Settings", href: "/dashboard/settings", icon: Settings, permission: "manage-settings" },
    ];

    // Filter items user has access to
    const visibleItems = navItems.filter(item => authLib.hasPermission(item.permission, user));

    return (
        <div className="flex h-full w-64 flex-col bg-gradient-to-b from-teal-950 via-emerald-950 to-teal-950 border-r border-teal-900/50 text-slate-300">
            {/* Shop Branding */}
            <div className="px-5 py-4 border-b border-white/15">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center flex-shrink-0">
                        <img src={mediPosLogo} alt="Medical POS Logo" className="ml-6 h-[80px] w-auto object-contain" />
                    </div>
                    {/* <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white leading-tight">
                            {shop?.name ?? "Medical POS"}
                        </p>
                        {shop?.city && (
                            <p className="flex items-center gap-1 text-xs text-slate-400 truncate mt-0.5">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                {shop.city}
                            </p>
                        )}
                    </div> */}
                </div>

                {/* Shop status badge */}
                {/* {shop && (
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
                )} */}
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
                                        ? "bg-emerald-600 text-white shadow-md"
                                        : "text-emerald-100/70 hover:bg-emerald-800/40 hover:text-white"
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

            <div className="border-t border-white/15 p-4">
                <div className="mb-4 px-2">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <span className="mt-1 inline-flex items-center rounded-full bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-300 capitalize">
                        {user.role}
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-800 hover:text-red-300"
                >
                    <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                    Logout
                </button>
            </div>
        </div>
    );
}
