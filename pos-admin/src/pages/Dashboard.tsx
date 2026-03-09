import { DollarSign, ShoppingBag, Users, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TrafficChart } from "@/components/dashboard/TrafficChart";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

const kpiData = [
    {
        title: "Total Revenue",
        value: "$97,214",
        change: 18.2,
        changeLabel: "vs last month",
        icon: DollarSign,
        color: "blue" as const,
    },
    {
        title: "Total Orders",
        value: "3,842",
        change: 12.5,
        changeLabel: "vs last month",
        icon: ShoppingBag,
        color: "emerald" as const,
    },
    {
        title: "Active Customers",
        value: "12,674",
        change: 8.1,
        changeLabel: "vs last month",
        icon: Users,
        color: "violet" as const,
    },
    {
        title: "Conversion Rate",
        value: "4.73%",
        change: -1.4,
        changeLabel: "vs last month",
        icon: TrendingUp,
        color: "amber" as const,
    },
];

export function Dashboard() {
    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Good evening, Admin 👋</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Here's what's happening with your store today.
                </p>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                {kpiData.map((kpi) => (
                    <MetricCard key={kpi.title} {...kpi} />
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                {/* Revenue area chart spans 2/3 */}
                <RevenueChart />
                {/* Traffic bar chart spans 1/3 */}
                <TrafficChart />
            </div>

            {/* Orders + Activity Row */}
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-3">
                {/* Orders table spans 2/3 */}
                <div className="xl:col-span-2">
                    <RecentOrdersTable />
                </div>
                {/* Activity feed spans 1/3 */}
                <ActivityFeed />
            </div>
        </div>
    );
}
