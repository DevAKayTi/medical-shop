import React, { useState } from "react";
import { ApiPurchase } from "@/lib/purchases";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AlertCircle } from "lucide-react";

interface Props {
    purchase: ApiPurchase;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
}

interface ReturnLine {
    purchase_item_id: string;
    product_id: string;
    product_name: string;
    batch_id?: string | null;
    batch_number?: string | null;
    max_quantity: number;
    quantity: number;
    price: number;
    total: number;
}

export function PurchaseReturnForm({ purchase, onSubmit, onCancel }: Props) {
    console.log("PurchaseReturnForm render", { purchase });
    const [reason, setReason] = useState("");
    const [status, setStatus] = useState<'pending' | 'completed'>('completed');
    const items = purchase?.items || [];
    const [lines, setLines] = useState<ReturnLine[]>(
        items.map(item => ({
            purchase_item_id: item.id!,
            product_id: item.product_id,
            product_name: item.product?.name || "Unknown Product",
            batch_id: item.batch_id,
            batch_number: item.batch?.batch_number || item.batch_number,
            max_quantity: Number(item.quantity || 0),
            quantity: 0,
            price: Number(item.purchase_price || 0),
            total: 0,
        }))
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateLine = (idx: number, qty: number) => {
        setLines(prev => prev.map((l, i) => {
            if (i !== idx) return l;
            const safeQty = Math.max(0, Math.min(l.max_quantity, qty));
            return {
                ...l,
                quantity: safeQty,
                total: safeQty * l.price
            };
        }));
    };

    const totalReturnAmount = lines.reduce((sum, l) => sum + l.total, 0);
    const hasItemsToReturn = lines.some(l => l.quantity > 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasItemsToReturn) {
            setError("Please specify at least one item to return.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const returnNumber = `PR-${new Date().getTime().toString().slice(-6)}`;
            await onSubmit({
                purchase_id: purchase.id,
                supplier_id: purchase.supplier_id,
                return_number: returnNumber,
                total: totalReturnAmount,
                reason,
                status,
                items: lines.filter(l => l.quantity > 0).map(l => ({
                    purchase_item_id: l.purchase_item_id,
                    product_id: l.product_id,
                    batch_id: l.batch_id,
                    quantity: l.quantity,
                    price: l.price,
                    total: l.total,
                })),
            });
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to create purchase return.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Return Items from {purchase.purchase_number}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Return Reason</label>
                        <Input
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="e.g. Damaged items, Wrong delivery…"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Return Status</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value as 'pending' | 'completed')}
                            className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="completed">Completed (Deduct stock now)</option>
                            <option value="pending">Pending (Review later)</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base text-slate-700 dark:text-slate-300">Select Items to Return</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3">Product / Batch</th>
                                    <th className="px-4 py-3 text-right">Purchased Qty</th>
                                    <th className="px-4 py-3 text-right">Return Qty</th>
                                    <th className="px-4 py-3 text-right">Price</th>
                                    <th className="px-4 py-3 text-right">Refund Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {lines.map((line, idx) => (
                                    <tr key={idx} className={line.quantity > 0 ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900 dark:text-slate-100">{line.product_name}</div>
                                            {line.batch_number && <div className="text-xs text-slate-500 font-mono mt-0.5">Batch: {line.batch_number}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-500">{line.max_quantity}</td>
                                        <td className="px-4 py-3 text-right w-32">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={line.max_quantity}
                                                value={line.quantity}
                                                onChange={e => updateLine(idx, parseInt(e.target.value) || 0)}
                                                className="text-right h-8"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-500">{Number(line.price).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            {line.total > 0 ? line.total.toFixed(2) : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-sm text-slate-500">
                    {hasItemsToReturn ? (
                        <span className="text-blue-600 font-medium italic">You are returning {lines.filter(l => l.quantity > 0).length} different items.</span>
                    ) : (
                        "Set return quantities above to see total."
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Refund Amount</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                        {totalReturnAmount.toFixed(2)}
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving || !hasItemsToReturn}>
                    {saving ? "Processing…" : "Submit Purchase Return"}
                </Button>
            </div>
        </form>
    );
}
