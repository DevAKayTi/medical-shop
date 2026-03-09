import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard, ShoppingCart, Users, BarChart3,
    Package, Settings, ChevronLeft, ChevronRight, X, Store,
    ChevronDown, ClipboardList, Clock, CheckCheck,
    UserRound, Layers, TrendingUp, PieChart,
    Tag, Warehouse, Sliders, Receipt, CreditCard,
    UserCog, CalendarClock, BadgePercent, Gift,
    Wallet, ArrowLeftRight, DollarSign, Bell,
    ShieldCheck, KeyRound, Lock, History as HistoryIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../contexts/AuthContext";

/* ─── Nav tree definition ─────────────────────────────────────────── */

interface NavChild {
    icon: React.ElementType;
    label: string;
    href: string;
    requiredPermissions?: string | string[];
}

interface NavItem {
    icon: React.ElementType;
    label: string;
    href?: string;          // present when no children
    children?: NavChild[];
    requiredPermissions?: string | string[];
}

// ── Section groups ─────────────────────────────────────────────────
interface NavSection {
    heading: string;
    items: NavItem[];
}

const navSections: NavSection[] = [
    {
        heading: "Overview",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", href: "/" },
        ],
    },
    {
        heading: "Tenants",
        items: [
            {
                icon: ShoppingCart,
                label: "Shops",
                children: [
                    { icon: ClipboardList, label: "All Shops", href: "/shops" },
                    { icon: CheckCheck, label: "Active Shops", href: "/shops/active" },
                    { icon: Clock, label: "Trial Shops", href: "/shops/trial" },
                    { icon: Settings, label: "Shop Settings", href: "/shops/settings" },
                    { icon: HistoryIcon, label: "Activity Log", href: "/shops/logs" },
                    { icon: Lock, label: "Suspended", href: "/shops/suspended" },
                ],
            },
            {
                icon: UserRound,
                label: "Shop Admins",
                children: [
                    { icon: UserRound, label: "All Admins", href: "/owners" },
                    { icon: UserCog, label: "Verified", href: "/owners/verified" },
                    { icon: Clock, label: "Pending KYC", href: "/owners/pending-kyc" },
                ],
            },
            {
                icon: Users,
                label: "Staff",
                children: [
                    { icon: Users, label: "All Staff", href: "/staffs" },
                    { icon: ShieldCheck, label: "Role and Permission", href: "/role-permissions" },
                ],
            },
        ],
    },
    {
        heading: "Subscriptions",
        items: [
            {
                icon: Layers,
                label: "Plans",
                children: [
                    { icon: Layers, label: "All Plans", href: "/plans" },
                    { icon: BadgePercent, label: "Monthly Plans", href: "/plans/monthly" },
                    { icon: Tag, label: "Annual Plans", href: "/plans/annual" },
                    { icon: Gift, label: "Free Trial", href: "/plans/trial" },
                ],
            },
            {
                icon: CalendarClock,
                label: "Subscriptions",
                children: [
                    { icon: ClipboardList, label: "All Subscriptions", href: "/subscriptions" },
                    { icon: CheckCheck, label: "Active", href: "/subscriptions/active" },
                    { icon: Clock, label: "Expiring Soon", href: "/subscriptions/expiring" },
                    { icon: Lock, label: "Cancelled", href: "/subscriptions/cancelled" },
                ],
            },
        ],
    },
    {
        heading: "Billing",
        items: [
            {
                icon: Receipt,
                label: "Invoices",
                children: [
                    { icon: Receipt, label: "All Invoices", href: "/invoices" },
                    { icon: Clock, label: "Unpaid", href: "/invoices/unpaid" },
                    { icon: CheckCheck, label: "Paid", href: "/invoices/paid" },
                    { icon: ArrowLeftRight, label: "Refunds", href: "/invoices/refunds" },
                ],
            },
            {
                icon: CreditCard,
                label: "Payments",
                children: [
                    { icon: CreditCard, label: "All Payments", href: "/payments" },
                    { icon: DollarSign, label: "Gateway Logs", href: "/payments/logs" },
                    { icon: ArrowLeftRight, label: "Chargebacks", href: "/payments/chargebacks" },
                ],
            },
        ],
    },
    {
        heading: "Licenses",
        items: [
            {
                icon: KeyRound,
                label: "License Keys",
                children: [
                    { icon: KeyRound, label: "All Licenses", href: "/licenses" },
                    { icon: CheckCheck, label: "Active", href: "/licenses/active" },
                    { icon: Clock, label: "Expiring", href: "/licenses/expiring" },
                    { icon: Lock, label: "Revoked", href: "/licenses/revoked" },
                ],
            },
            {
                icon: Package,
                label: "Modules",
                children: [
                    { icon: Package, label: "All Modules", href: "/modules" },
                    { icon: Sliders, label: "Feature Flags", href: "/modules/features" },
                ],
            },
        ],
    },
    {
        heading: "Support",
        items: [
            {
                icon: Warehouse,
                label: "Tickets",
                children: [
                    { icon: ClipboardList, label: "All Tickets", href: "/tickets" },
                    { icon: Clock, label: "Open", href: "/tickets/open" },
                    { icon: CheckCheck, label: "Resolved", href: "/tickets/resolved" },
                ],
            },
            {
                icon: Gift,
                label: "Announcements",
                children: [
                    { icon: Gift, label: "All", href: "/announcements" },
                    { icon: Clock, label: "Scheduled", href: "/announcements/scheduled" },
                ],
            },
        ],
    },
    {
        heading: "Analytics",
        items: [
            {
                icon: BarChart3,
                label: "Reports",
                children: [
                    { icon: PieChart, label: "Overview", href: "/analytics" },
                    { icon: TrendingUp, label: "Revenue", href: "/analytics/revenue" },
                    { icon: Users, label: "Tenant Growth", href: "/analytics/tenants" },
                    { icon: BarChart3, label: "Churn Rate", href: "/analytics/churn" },
                ],
            },
            {
                icon: Wallet,
                label: "Finance",
                children: [
                    { icon: DollarSign, label: "MRR / ARR", href: "/finance/mrr" },
                    { icon: Wallet, label: "Payouts", href: "/finance/payouts" },
                    { icon: Receipt, label: "Tax Reports", href: "/finance/tax" },
                ],
            },
        ],
    },
    {
        heading: "User Management",
        items: [
            {
                icon: UserRound,
                label: "Admin Users",
                requiredPermissions: "read-user",
                children: [
                    { icon: UserRound, label: "All Users", href: "/users" },
                    { icon: UserCog, label: "Active Users", href: "/users/active" },
                    { icon: Lock, label: "Suspended", href: "/users/suspended" },
                ],
            },
            {
                icon: ShieldCheck,
                label: "Roles",
                requiredPermissions: "read-role",
                children: [
                    { icon: ShieldCheck, label: "All Roles", href: "/roles" },
                    { icon: Sliders, label: "Manage Roles", href: "/roles/manage" },
                ],
            },
            {
                icon: KeyRound,
                label: "Permissions",
                requiredPermissions: "read-permission",
                children: [
                    { icon: KeyRound, label: "All Permissions", href: "/permissions" },
                    { icon: ShieldCheck, label: "Access Matrix", href: "/permissions/matrix" },
                ],
            },
        ],
    },
];

const bottomItems: NavItem[] = [
    {
        icon: Bell,
        label: "Notifications",
        href: "/notifications",
    },
    {
        icon: Settings,
        label: "Settings",
        children: [
            { icon: Sliders, label: "General", href: "/settings" },
            { icon: UserRound, label: "Account", href: "/settings/account" },
        ],
    },
];

/* ─── Helper: is any child route currently active? ─────────────────── */
function isGroupActive(item: NavItem, pathname: string) {
    if (item.href) return pathname.startsWith(item.href) && (pathname === item.href || item.href !== "/");
    return item.children?.some((c) => pathname.startsWith(c.href) && (pathname === c.href || c.href !== "/")) ?? false;
}

/* ─── Props ─────────────────────────────────────────────────────────── */
interface SidebarProps {
    collapsed: boolean;
    onCollapse: (v: boolean) => void;
    mobileOpen: boolean;
    onMobileClose: () => void;
}

/* ─── Component ─────────────────────────────────────────────────────── */
export function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
    const { pathname } = useLocation();
    const { hasPermission } = useAuth();

    // Filter items based on permissions
    const filterNavItems = (items: NavItem[]): NavItem[] => {
        return items.filter(item => {
            if (item.requiredPermissions && !hasPermission(item.requiredPermissions)) {
                return false;
            }
            if (item.children) {
                const visibleIdx = item.children.findIndex(child => !child.requiredPermissions || hasPermission(child.requiredPermissions));
                if (item.children.length > 0 && visibleIdx === -1) {
                    return false;
                }
            }
            return true;
        }).map(item => {
            if (item.children) {
                return {
                    ...item,
                    children: item.children.filter(child => !child.requiredPermissions || hasPermission(child.requiredPermissions))
                };
            }
            return item;
        });
    };

    const filteredNavSections = navSections.map(section => ({
        ...section,
        items: filterNavItems(section.items)
    })).filter(section => section.items.length > 0);

    const filteredBottomItems = filterNavItems(bottomItems);

    // Track which group is open by label
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        const allItems = [
            ...filteredNavSections.flatMap((s) => s.items),
            ...filteredBottomItems,
        ];
        allItems.forEach((item) => {
            if (isGroupActive(item, pathname)) initial[item.label] = true;
        });
        return initial;
    });

    const toggleGroup = (label: string) =>
        setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

    /* Shared link classes */
    const linkBase = (active: boolean) =>
        cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 w-full",
            active
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : [
                    "text-[hsl(var(--sidebar-text))]",
                    "hover:bg-[hsl(var(--sidebar-hover))]",
                    "hover:text-[hsl(var(--sidebar-text-strong))]",
                ]
        );

    /* Render a nav section (main or bottom) */
    const renderItem = (item: NavItem) => {
        const Icon = item.icon;
        const groupActive = isGroupActive(item, pathname);
        const isOpen = openGroups[item.label] ?? false;

        // ── Leaf (no children) ──
        if (!item.children) {
            return (
                <li key={item.label}>
                    <NavLink
                        to={item.href!}
                        onClick={onMobileClose}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                            cn(linkBase(isActive), collapsed && "justify-center px-2")
                        }
                    >
                        <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                </li>
            );
        }

        // ── Group with children ──
        return (
            <li key={item.label}>
                {/* Parent trigger */}
                <button
                    onClick={() => !collapsed && toggleGroup(item.label)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                        linkBase(groupActive && !isOpen),
                        collapsed ? "justify-center px-2 w-full" : "w-full"
                    )}
                >
                    <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                    {!collapsed && (
                        <>
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronDown
                                className={cn(
                                    "h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200",
                                    isOpen && "rotate-180"
                                )}
                            />
                        </>
                    )}
                </button>

                {/* Children (hidden in collapsed mode) */}
                {!collapsed && isOpen && (
                    <ul className="mt-1 ml-2 space-y-0.5 border-l border-[hsl(var(--sidebar-border))] pl-3">
                        {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                                <li key={child.href}>
                                    <NavLink
                                        to={child.href}
                                        end
                                        onClick={onMobileClose}
                                        className={({ isActive }) =>
                                            cn(
                                                "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-all duration-150",
                                                isActive
                                                    ? "bg-primary/10 text-primary font-semibold"
                                                    : [
                                                        "text-[hsl(var(--sidebar-text))]",
                                                        "hover:bg-[hsl(var(--sidebar-hover))]",
                                                        "hover:text-[hsl(var(--sidebar-text-strong))]",
                                                    ]
                                            )
                                        }
                                    >
                                        <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                        <span>{child.label}</span>
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <>
            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={onMobileClose}
                />
            )}

            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 flex h-screen flex-col overflow-hidden",
                    "border-r border-[hsl(var(--sidebar-border))]",
                    "bg-[hsl(var(--sidebar-bg))]",
                    "transition-all duration-300 ease-in-out",
                    "lg:relative lg:translate-x-0",
                    collapsed ? "lg:w-[68px]" : "lg:w-64",
                    mobileOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 lg:translate-x-0"
                )}
            >
                {/* ── Logo ── */}
                <div
                    className={cn(
                        "flex h-16 shrink-0 items-center border-b border-[hsl(var(--sidebar-border))]",
                        collapsed ? "justify-center px-2" : "px-5 gap-3"
                    )}
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
                        <Store className="h-5 w-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold leading-none text-[hsl(var(--sidebar-text-strong))]">
                                SHOP
                            </p>
                            <p className="mt-0.5 text-[11px] text-[hsl(var(--sidebar-text-muted))]">
                                Admin Platform
                            </p>
                        </div>
                    )}
                    <button
                        onClick={onMobileClose}
                        className="ml-auto lg:hidden text-[hsl(var(--sidebar-text))] hover:text-[hsl(var(--sidebar-text-strong))] transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* ── Nav ── */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
                    {filteredNavSections.map((section) => (
                        <div key={section.heading}>
                            {!collapsed && (
                                <p className="mt-3 mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--sidebar-text-muted))]">
                                    {section.heading}
                                </p>
                            )}
                            <ul className="space-y-0.5">
                                {section.items.map(renderItem)}
                            </ul>
                        </div>
                    ))}

                    <div className="my-3 h-px bg-[hsl(var(--sidebar-border))]" />

                    {!collapsed && (
                        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--sidebar-text-muted))]">
                            System
                        </p>
                    )}
                    <ul className="space-y-0.5">{filteredBottomItems.map(renderItem)}</ul>
                </nav>

                {/* ── Collapse toggle (desktop only) ── */}
                <div className="hidden lg:flex shrink-0 border-t border-[hsl(var(--sidebar-border))] p-2 justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onCollapse(!collapsed)}
                        className={cn(
                            "h-8 w-8 transition-colors",
                            "text-[hsl(var(--sidebar-text))]",
                            "hover:text-[hsl(var(--sidebar-text-strong))]",
                            "hover:bg-[hsl(var(--sidebar-hover))]"
                        )}
                    >
                        {collapsed
                            ? <ChevronRight className="h-4 w-4" />
                            : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>
            </aside>
        </>
    );
}
