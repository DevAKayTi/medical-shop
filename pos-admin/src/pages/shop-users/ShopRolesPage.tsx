import { ShieldCheck, Info } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function ShopRolesPage() {
    const roles = [
        {
            name: "Admin",
            slug: "admin",
            description: "Full control over the shop. One admin per shop.",
            permissions: ["Product Management", "Sales & Refunds", "Staff Management", "Reports", "Settings"],
            color: "bg-purple-500/15 text-purple-700 border-purple-500/30"
        },
        {
            name: "Manager",
            slug: "manager",
            description: "Manage products, sales, staff and view reports.",
            permissions: ["Product Management", "Sales & Refunds", "Staff Management (Read/Create)", "Reports"],
            color: "bg-blue-500/15 text-blue-700 border-blue-500/30"
        },
        {
            name: "Staff",
            slug: "staff",
            description: "Day-to-day POS operations (sales only).",
            permissions: ["Read Products", "Create Sale", "Read Sale"],
            color: "bg-slate-500/15 text-slate-700 border-slate-500/30"
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Role and Permission</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Define what different staff members can do within their shops.
                    </p>
                </div>
            </div>

            <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="flex flex-row items-center gap-4 py-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <Info className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-base text-primary">Predefined Roles</CardTitle>
                        <CardDescription className="text-primary/70">
                            These roles are standard for all tenant shops and cannot be modified by global admins.
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[180px]">Role</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Permissions Scope</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.map((role) => (
                            <TableRow key={role.slug}>
                                <TableCell>
                                    <Badge variant="outline" className={`gap-1 ${role.color}`}>
                                        <ShieldCheck className="h-3 w-3" />
                                        {role.name}
                                    </Badge>
                                </TableCell>
                                <TableCell className="max-w-[300px]">
                                    <div className="text-sm text-foreground">{role.description}</div>
                                    <div className="text-xs text-muted-foreground font-mono mt-1">{role.slug}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1.5">
                                        {role.permissions.map((perm) => (
                                            <Badge key={perm} variant="secondary" className="text-[10px] font-normal py-0 px-2 bg-muted/50">
                                                {perm}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
