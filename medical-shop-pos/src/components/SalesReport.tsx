import { useMemo } from "react";
import { Sale } from "@/lib/storage";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface SalesReportProps {
    sales: Sale[];
    period: "daily" | "monthly";
}

export function SalesReport({ sales, period }: SalesReportProps) {
    const chartData = useMemo(() => {
        const revenueMap: Record<string, number> = {};

        sales.forEach((sale) => {
            const date = new Date(sale.timestamp);
            let key = "";

            if (period === "daily") {
                // Format: YYYY-MM-DD
                key = date.toISOString().split("T")[0];
            } else {
                // Format: YYYY-MM
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            }

            if (!revenueMap[key]) {
                revenueMap[key] = 0;
            }
            revenueMap[key] += sale.total;
        });

        // Convert to sorted array
        return Object.entries(revenueMap)
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30); // Show last 30 data points
    }, [sales, period]);

    if (chartData.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed border-slate-300 dark:border-slate-800">
                <p className="text-sm text-slate-500">No sales data available for chart.</p>
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{
                        top: 20,
                        right: 0,
                        left: 0,
                        bottom: 20,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        tickMargin={10}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={(value) => `$${value}`}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                    />
                    <Tooltip
                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar
                        dataKey="revenue"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
