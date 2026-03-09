import type { ElementType } from "react";
import {
    UserPlus, ShoppingCart, AlertCircle,
    Package, CreditCard, Settings, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ActivityItem {
    id: string;
    icon: ElementType;
    color: string;
    bgColor: string;
    message: string;
    time: string;
    subtext?: string;
}

const activities: ActivityItem[] = [
    { id: "1", icon: UserPlus, color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30", message: "New customer registered", subtext: "Liam Parker joined the platform", time: "2 min ago" },
    { id: "2", icon: ShoppingCart, color: "text-emerald-500", bgColor: "bg-emerald-100 dark:bg-emerald-900/30", message: "Order #ORD-7821 completed", subtext: "$349.99 processed successfully", time: "14 min ago" },
    { id: "3", icon: AlertCircle, color: "text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-900/30", message: "Low stock alert", subtext: "Product SKU-4892 below threshold", time: "32 min ago" },
    { id: "4", icon: CreditCard, color: "text-violet-500", bgColor: "bg-violet-100 dark:bg-violet-900/30", message: "Payment refund processed", subtext: "Order #ORD-7817 — $199.99", time: "1 hr ago" },
    { id: "5", icon: Package, color: "text-cyan-500", bgColor: "bg-cyan-100 dark:bg-cyan-900/30", message: "Shipment dispatched", subtext: "3 orders shipped via FastEx", time: "2 hr ago" },
    { id: "6", icon: Settings, color: "text-slate-500", bgColor: "bg-slate-100 dark:bg-slate-800/50", message: "System settings updated", subtext: "Tax rate adjusted to 7.2%", time: "3 hr ago" },
    { id: "7", icon: RefreshCw, color: "text-rose-500", bgColor: "bg-rose-100 dark:bg-rose-900/30", message: "Database backup completed", subtext: "Snapshot saved — 2.4 GB", time: "5 hr ago" },
];

export function ActivityFeed() {
    return (
        <Card className="animate-fade-in">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Activity Feed</CardTitle>
                <CardDescription>Recent system events</CardDescription>
            </CardHeader>
            <CardContent>
                <ol className="relative space-y-1">
                    {activities.map((item, idx) => {
                        const Icon = item.icon;
                        const isLast = idx === activities.length - 1;
                        return (
                            <li key={item.id} className="relative flex gap-4 pb-5">
                                {/* Vertical line */}
                                {!isLast && (
                                    <span
                                        className="absolute left-4 top-9 h-full w-px bg-border"
                                        aria-hidden="true"
                                    />
                                )}
                                {/* Icon bubble */}
                                <div
                                    className={cn(
                                        "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                                        item.bgColor
                                    )}
                                >
                                    <Icon className={cn("h-3.5 w-3.5", item.color)} />
                                </div>
                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-1">
                                    <p className="text-sm font-medium text-foreground leading-snug">{item.message}</p>
                                    {item.subtext && (
                                        <p className="mt-0.5 text-xs text-muted-foreground truncate">{item.subtext}</p>
                                    )}
                                    <span className="mt-1 inline-block text-[11px] text-muted-foreground/70">{item.time}</span>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </CardContent>
        </Card>
    );
}
