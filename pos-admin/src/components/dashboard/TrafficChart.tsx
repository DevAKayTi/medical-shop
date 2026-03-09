import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const data = [
    { day: "Mon", organic: 320, paid: 180, referral: 95 },
    { day: "Tue", organic: 280, paid: 220, referral: 110 },
    { day: "Wed", organic: 410, paid: 190, referral: 130 },
    { day: "Thu", organic: 350, paid: 260, referral: 90 },
    { day: "Fri", organic: 490, paid: 310, referral: 145 },
    { day: "Sat", organic: 570, paid: 280, referral: 200 },
    { day: "Sun", organic: 430, paid: 220, referral: 160 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border bg-popover px-4 py-3 shadow-lg">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} className="text-sm" style={{ color: p.color }}>
                        {p.name}: <span className="font-bold">{p.value.toLocaleString()}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export function TrafficChart() {
    return (
        <Card className="animate-fade-in">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Traffic Sources</CardTitle>
                <CardDescription>Visitor channels — last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                            dataKey="day"
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
                        <Legend
                            formatter={(value) => (
                                <span className="text-xs capitalize text-muted-foreground">{value}</span>
                            )}
                        />
                        <Bar dataKey="organic" name="Organic" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                        <Bar dataKey="paid" name="Paid" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                        <Bar dataKey="referral" name="Referral" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
