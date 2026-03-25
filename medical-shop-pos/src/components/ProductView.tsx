import { useState, useEffect } from "react";
import { ApiProduct, ApiCategory, ApiProductBatch, productApi } from "@/lib/inventory";
import { getCurrencySymbol, formatNumber } from "@/lib/currency";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface Props {
    product: ApiProduct;
    categories: ApiCategory[];
    onClose: () => void;
}

export function ProductView({ product, categories, onClose }: Props) {
    const category = categories.find(c => c.id === product.category_id);
    const [batches, setBatches] = useState<ApiProductBatch[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(true);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const data = await productApi.batches(product.id);
                if (active) setBatches(data);
            } catch (e) {
                console.error("Failed to load batches", e);
            } finally {
                if (active) setLoadingBatches(false);
            }
        })();
        return () => { active = false; };
    }, [product.id]);

    function isExpiring(date: string) {
        const d = new Date(date);
        const soon = new Date();
        soon.setMonth(soon.getMonth() + 6);
        return d < soon;
    }

    return (
        <div className="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-4">
                <div>
                    <h3 className="text-base/7 font-semibold text-slate-900 dark:text-white">Product Information</h3>
                    <p className="mt-1 max-w-2xl text-sm/6 text-slate-500 dark:text-slate-400">Detailed catalog information for {product.name}.</p>
                </div>
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Close
                </button>
            </div>

            <div className="mt-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2">
                    <div className="border-t border-slate-100 px-4 py-6 sm:col-span-1 sm:px-0 dark:border-slate-800">
                        <dt className="text-sm/6 font-medium text-slate-900 dark:text-white">Product / Medicine Name</dt>
                        <dd className="mt-1 text-sm/6 text-slate-700 sm:mt-2 dark:text-slate-400">{product.name}</dd>
                    </div>
                    <div className="border-t border-slate-100 px-4 py-6 sm:col-span-1 sm:px-0 dark:border-slate-800">
                        <dt className="text-sm/6 font-medium text-slate-900 dark:text-white">Generic Name</dt>
                        <dd className="mt-1 text-sm/6 text-slate-700 sm:mt-2 dark:text-slate-400">{product.generic_name || "—"}</dd>
                    </div>

                    <div className="border-t border-slate-100 px-4 py-6 sm:col-span-1 sm:px-0 dark:border-slate-800">
                        <dt className="text-sm/6 font-medium text-slate-900 dark:text-white">Barcode / GTIN</dt>
                        <dd className="mt-1 text-sm/6 text-slate-700 sm:mt-2 dark:text-slate-400 font-mono">{product.barcode || "—"}</dd>
                    </div>
                    <div className="border-t border-slate-100 px-4 py-6 sm:col-span-1 sm:px-0 dark:border-slate-800">
                        <dt className="text-sm/6 font-medium text-slate-900 dark:text-white">Internal SKU</dt>
                        <dd className="mt-1 text-sm/6 text-slate-700 sm:mt-2 dark:text-slate-400 font-mono">{product.sku || "—"}</dd>
                    </div>

                    <div className="border-t border-slate-100 px-4 py-6 sm:col-span-1 sm:px-0 dark:border-slate-800">
                        <dt className="text-sm/6 font-medium text-slate-900 dark:text-white">Manufacturer / Brand</dt>
                        <dd className="mt-1 text-sm/6 text-slate-700 sm:mt-2 dark:text-slate-400">{product.manufacturer || "—"}</dd>
                    </div>
                    <div className="border-t border-slate-100 px-4 py-6 sm:col-span-1 sm:px-0 dark:border-slate-800">
                        <dt className="text-sm/6 font-medium text-slate-900 dark:text-white">Medicine Type</dt>
                        <dd className="mt-1 text-sm/6 text-slate-700 sm:mt-2 dark:text-slate-400 capitalize">{product.medicine_type || "—"}</dd>
                    </div>

                    <div className="border-t border-slate-100 px-4 py-6 sm:col-span-1 sm:px-0 dark:border-slate-800">
                        <dt className="text-sm/6 font-medium text-slate-900 dark:text-white">Category</dt>
                        <dd className="mt-1 text-sm/6 text-slate-700 sm:mt-2 dark:text-slate-400">{category?.name || "Uncategorized"}</dd>
                    </div>
                    <div className="border-t border-slate-100 px-4 py-6 sm:col-span-1 sm:px-0 dark:border-slate-800">
                        <dt className="text-sm/6 font-medium text-slate-900 dark:text-white">Base Unit</dt>
                        <dd className="mt-1 text-sm/6 text-slate-700 sm:mt-2 dark:text-slate-400 capitalize">{product.unit || "—"}</dd>
                    </div>

                    <div className="border-t border-slate-100 px-4 py-6 sm:col-span-1 sm:px-0 dark:border-slate-800">
                        <dt className="text-sm/6 font-medium text-slate-900 dark:text-white">MRP (Selling Price)</dt>
                        <dd className="mt-1 text-sm/6 font-semibold text-slate-900 sm:mt-2 dark:text-slate-100">{product.mrp} {getCurrencySymbol()}</dd>
                    </div>


                    <div className="border-t border-slate-100 px-4 py-6 sm:col-span-2 sm:px-0 dark:border-slate-800">
                        <dt className="text-sm/6 font-medium text-slate-900 dark:text-white">Status & Flags</dt>
                        <dd className="mt-2 flex flex-wrap gap-3 text-sm/6 text-slate-700 sm:mt-2 dark:text-slate-400">
                            {product.is_active ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2 className="h-4 w-4" /> Active
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    <Info className="h-4 w-4" /> Inactive
                                </span>
                            )}

                            {product.is_controlled_drug && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                    <AlertTriangle className="h-4 w-4" /> Controlled Drug
                                </span>
                            )}

                            {product.prescription_required && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                                    <Info className="h-4 w-4" /> Rx Required
                                </span>
                            )}
                        </dd>
                    </div>

                    <div className="border-t border-slate-100 px-4 py-6 sm:col-span-2 sm:px-0 dark:border-slate-800">
                        <dt className="text-sm/6 font-medium text-slate-900 dark:text-white">Description / Usage Notes</dt>
                        <dd className="mt-1 text-sm/6 text-slate-700 sm:mt-2 dark:text-slate-400">
                            {product.description || <span className="italic text-slate-400">No description provided.</span>}
                        </dd>
                    </div>
                    <div className="border-t border-slate-100 px-4 py-6 sm:col-span-2 sm:px-0 dark:border-slate-800">
                        <dt className="text-sm/6 font-medium text-slate-900 dark:text-white">Stock Batches</dt>
                        <dd className="mt-4 text-sm/6 text-slate-700 dark:text-slate-400">
                            {loadingBatches ? (
                                <div className="text-center py-4 text-slate-500 text-xs">Loading batches...</div>
                            ) : batches.length === 0 ? (
                                <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-200 dark:border-slate-800/80 rounded-md">
                                    No stock batches found for this product.
                                </div>
                            ) : (
                                <div className="overflow-x-auto ring-1 ring-slate-100 dark:ring-slate-800/60 rounded-lg">
                                    <table className="min-w-full text-sm text-left">
                                        <thead className="bg-slate-50/80 dark:bg-slate-900/40 text-slate-500 border-b border-slate-200 dark:border-slate-800/80">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">Batch #</th>
                                                <th className="px-4 py-3 font-semibold">Supplier</th>
                                                <th className="px-4 py-3 font-semibold">Expiry</th>
                                                <th className="px-4 py-3 font-semibold text-right">Stock</th>
                                                <th className="px-4 py-3 font-semibold text-right">Vendor Price</th>
                                                <th className="px-4 py-3 font-semibold text-right">Selling Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-slate-950/20">
                                            {batches.map(b => (
                                                <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                                    <td className="px-4 py-3 font-mono text-xs">{b.batch_number}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{b.supplier?.name || "Unknown"}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={isExpiring(b.expiry_date) ? "text-amber-600 dark:text-amber-500 font-semibold" : ""}>
                                                            {new Date(b.expiry_date).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">{b.quantity}</td>
                                                    <td className="px-4 py-3 text-right text-slate-500 font-medium">{formatNumber(b.purchase_price)} {getCurrencySymbol()}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">{formatNumber(b.selling_price)} {getCurrencySymbol()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
