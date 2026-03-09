import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiProduct } from "@/lib/inventory";

interface StockAdjustmentFormProps {
    products: ApiProduct[];
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
}

export function StockAdjustmentForm({ products, onSave, onCancel }: StockAdjustmentFormProps) {
    const [productId, setProductId] = useState("");
    const [batchId, setBatchId] = useState("");
    const [type, setType] = useState<"increase" | "decrease" | "write_off" | "correction">("increase");
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const selectedProduct = products.find(p => p.id === productId);
    const productBatches = selectedProduct?.batches ?? [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                product_id: productId,
                batch_id: batchId || null,
                type,
                quantity,
                reason,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>New Stock Adjustment</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Product</label>
                            <select
                                required
                                value={productId}
                                onChange={e => { setProductId(e.target.value); setBatchId(""); }}
                                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                            >
                                <option value="">Select Product...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Batch (Required)</label>
                            <select
                                required
                                value={batchId}
                                onChange={e => setBatchId(e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                            >
                                <option value="">Select Batch...</option>
                                {productBatches.map(b => (
                                    <option key={b.id} value={b.id}>{b.batch_number} (Qty: {b.quantity})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Adjustment Type</label>
                            <select
                                required
                                value={type}
                                onChange={e => setType(e.target.value as any)}
                                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                            >
                                <option value="increase">Stock Increase</option>
                                <option value="decrease">Stock Decrease</option>
                                <option value="write_off">Write-Off (Damage/Expired)</option>
                                <option value="correction">Correction</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Quantity</label>
                            <Input
                                type="number"
                                required
                                min="1"
                                value={quantity}
                                onChange={e => setQuantity(parseInt(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Reason / Remarks</label>
                        <textarea
                            required
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="e.g., Damaged during transport, Stock count correction..."
                            className="w-full min-h-[80px] px-3 py-2 rounded-md border border-slate-200 bg-white text-sm"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !productId}>
                            {loading ? "Processing..." : "Save Adjustment"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
