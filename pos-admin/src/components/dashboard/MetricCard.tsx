import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string;
    change: number;   // positive = up, negative = down
    changeLabel?: string;
    icon: LucideIcon;
    color: "blue" | "emerald" | "violet" | "amber";
}

const colorMap = {
    blue: { bg: "bg-blue-100 dark:bg-blue-900/30", icon: "text-blue-600 dark:text-blue-400" },
    emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/30", icon: "text-emerald-600 dark:text-emerald-400" },
    violet: { bg: "bg-violet-100 dark:bg-violet-900/30", icon: "text-violet-600 dark:text-violet-400" },
    amber: { bg: "bg-amber-100 dark:bg-amber-900/30", icon: "text-amber-600 dark:text-amber-400" },
};

export function MetricCard({ title, value, change, changeLabel, icon: Icon, color }: MetricCardProps) {
    const isUp = change >= 0;
    const colors = colorMap[color];

    return (
        <Card className="relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 animate-fade-in">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="mt-2 text-3xl font-bold text-foreground tracking-tight">{value}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                            {isUp
                                ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                            <span className={cn(
                                "text-sm font-medium",
                                isUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                            )}>
                                {isUp ? "+" : ""}{change}%
                            </span>
                            {changeLabel && (
                                <span className="text-xs text-muted-foreground">{changeLabel}</span>
                            )}
                        </div>
                    </div>
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", colors.bg)}>
                        <Icon className={cn("h-6 w-6", colors.icon)} />
                    </div>
                </div>

                {/* Subtle gradient accent */}
                <div className={cn(
                    "absolute bottom-0 left-0 h-1 w-full",
                    color === "blue" && "bg-gradient-to-r from-blue-500 to-blue-400",
                    color === "emerald" && "bg-gradient-to-r from-emerald-500 to-emerald-400",
                    color === "violet" && "bg-gradient-to-r from-violet-500 to-violet-400",
                    color === "amber" && "bg-gradient-to-r from-amber-500 to-amber-400",
                )} />
            </CardContent>
        </Card>
    );
}
