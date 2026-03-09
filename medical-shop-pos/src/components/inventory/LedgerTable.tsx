import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ApiInventoryLedger } from "@/lib/inventory";
import { ArrowUpRight, ArrowDownRight, User } from "lucide-react";

interface LedgerTableProps {
    data: ApiInventoryLedger[];
    loading: boolean;
}

export function LedgerTable({ data, loading }: LedgerTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Inventory Movement History</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="py-12 text-center text-slate-400">Loading history...</div>
                ) : data.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">No stock movements recorded yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-slate-50 text-slate-500 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Date & Time</th>
                                    <th className="px-4 py-3 font-medium">Product / Batch / Supplier</th>
                                    <th className="px-4 py-3 font-medium text-center">Type</th>
                                    <th className="px-4 py-3 font-medium text-right">Qty</th>
                                    <th className="px-4 py-3 font-medium text-right">Balance After</th>
                                    <th className="px-4 py-3 font-medium">Reference</th>
                                    <th className="px-4 py-3 font-medium">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {data.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                                            {new Date(item.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800 dark:text-slate-200">{item.product?.name}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {item.batch && <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500">{item.batch.batch_number}</span>}
                                                <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={item.batch?.supplier?.name}>
                                                    {item.batch?.supplier?.name ?? "No Supplier"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${item.type === 'credit'
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                }`}>
                                                {item.type === 'credit' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                {item.type === 'credit' ? "Inbound" : "Outbound"}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 text-right font-bold ${item.type === 'credit' ? "text-green-600" : "text-red-600"}`}>
                                            {item.type === 'credit' ? "+" : "-"}{item.quantity}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">{item.balance_after}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs uppercase font-semibold text-slate-500">{item.reference_type}</div>
                                            {item.creator && (
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                                    <User className="h-2.5 w-2.5" /> {item.creator.name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate" title={item.notes ?? ""}>
                                            {item.notes ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
