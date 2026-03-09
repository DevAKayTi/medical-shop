import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type OrderStatus = "completed" | "pending" | "processing" | "cancelled";

interface Order {
    id: string;
    customer: string;
    avatar: string;
    date: string;
    amount: string;
    items: number;
    status: OrderStatus;
}

const orders: Order[] = [
    { id: "#ORD-7821", customer: "Sarah Johnson", avatar: "SJ", date: "Mar 03, 2026", amount: "$349.99", items: 3, status: "completed" },
    { id: "#ORD-7820", customer: "Michael Chen", avatar: "MC", date: "Mar 03, 2026", amount: "$1,240.00", items: 7, status: "processing" },
    { id: "#ORD-7819", customer: "Emma Williams", avatar: "EW", date: "Mar 02, 2026", amount: "$89.50", items: 1, status: "pending" },
    { id: "#ORD-7818", customer: "James Anderson", avatar: "JA", date: "Mar 02, 2026", amount: "$520.00", items: 4, status: "completed" },
    { id: "#ORD-7817", customer: "Olivia Martinez", avatar: "OM", date: "Mar 01, 2026", amount: "$199.99", items: 2, status: "cancelled" },
    { id: "#ORD-7816", customer: "Noah Thompson", avatar: "NT", date: "Mar 01, 2026", amount: "$755.00", items: 5, status: "completed" },
    { id: "#ORD-7815", customer: "Ava Robinson", avatar: "AR", date: "Feb 29, 2026", amount: "$312.50", items: 2, status: "processing" },
];

const statusConfig: Record<OrderStatus, { label: string; variant: any }> = {
    completed: { label: "Completed", variant: "success" },
    pending: { label: "Pending", variant: "warning" },
    processing: { label: "Processing", variant: "processing" },
    cancelled: { label: "Cancelled", variant: "cancelled" },
};

const avatarColors: Record<string, string> = {
    SJ: "bg-blue-500", MC: "bg-violet-500", EW: "bg-rose-500",
    JA: "bg-emerald-500", OM: "bg-amber-500", NT: "bg-cyan-500", AR: "bg-pink-500",
};

export function RecentOrdersTable() {
    return (
        <Card className="animate-fade-in">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
                        <CardDescription>Latest 7 transactions</CardDescription>
                    </div>
                    <button className="text-xs font-medium text-primary hover:underline">View all</button>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6">Order</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="hidden md:table-cell">Date</TableHead>
                            <TableHead className="hidden sm:table-cell text-right">Amount</TableHead>
                            <TableHead className="text-right pr-6">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => {
                            const { label, variant } = statusConfig[order.status];
                            return (
                                <TableRow key={order.id} className="group">
                                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                                        {order.id}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColors[order.avatar]}`}>
                                                {order.avatar}
                                            </div>
                                            <span className="text-sm font-medium">{order.customer}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                        {order.date}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-right font-semibold text-sm">
                                        {order.amount}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Badge variant={variant}>{label}</Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
