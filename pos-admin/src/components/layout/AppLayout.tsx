import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/orders": "Orders",
    "/customers": "Customers",
    "/analytics": "Analytics",
    "/products": "Products",
    "/settings": "Settings",
    "/users": "Users",
    "/users/create": "Create User",
    "/users/active": "Active Users",
    "/users/suspended": "Suspended Users",
    "/roles": "Roles",
    "/roles/manage": "Manage Roles",
    "/roles/create": "Create Role",
    "/permissions": "Permissions",
    "/permissions/matrix": "Access Matrix",
    "/notifications": "Notifications",
    "/shops": "All Shops",
    "/shops/active": "Active Shops",
    "/shops/trial": "Trial Shops",
    "/shops/suspended": "Suspended Shops",
    "/shops/create": "Create Shop",
    "/shops/settings": "Shop Settings",
    "/shops/logs": "Activity Log",
    "/staffs": "All Staff",
    "/staffs/create": "Add Staff",
    "/role-permissions": "Role and Permission",
};

export function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { pathname } = useLocation();

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <Sidebar
                collapsed={collapsed}
                onCollapse={setCollapsed}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar
                    onMobileMenuOpen={() => setMobileOpen(true)}
                    pageTitle={pageTitles[pathname] ?? "Dashboard"}
                />
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
