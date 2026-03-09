import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const data = [
    { month: "Jan", revenue: 42000, profit: 18000 },
    { month: "Feb", revenue: 48000, profit: 21000 },
    { month: "Mar", revenue: 55000, profit: 24000 },
    { month: "Apr", revenue: 51000, profit: 22000 },
    { month: "May", revenue: 63000, profit: 29000 },
    { month: "Jun", revenue: 71000, profit: 34000 },
    { month: "Jul", revenue: 68000, profit: 32000 },
    { month: "Aug", revenue: 79000, profit: 38000 },
    { month: "Sep", revenue: 85000, profit: 41000 },
    { month: "Oct", revenue: 91000, profit: 45000 },
    { month: "Nov", revenue: 88000, profit: 42000 },
    { month: "Dec", revenue: 97000, profit: 51000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border bg-popover px-4 py-3 shadow-lg">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} className="text-sm" style={{ color: p.color }}>
                        {p.name}: <span className="font-bold">${p.value.toLocaleString()}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export function RevenueChart() {
    return (
        <Card className="col-span-2 animate-fade-in">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
                        <CardDescription>Monthly revenue and profit for 2025</CardDescription>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        +18.2% YoY
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            formatter={(value) => (
                                <span className="text-xs capitalize text-muted-foreground">{value}</span>
                            )}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            name="Revenue"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            fill="url(#colorRevenue)"
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="profit"
                            name="Profit"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            fill="url(#colorProfit)"
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
