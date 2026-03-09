import { AlertTriangle, Info } from "lucide-react";
import { Product } from "@/lib/storage";

interface InventoryAlertProps {
    products: Product[];
}

export function InventoryAlert({ products }: InventoryAlertProps) {
    // Logic for alerts
    const LOW_STOCK_THRESHOLD = 15;
    const EXPIRY_WARNING_DAYS = 90; // 3 months warning

    const today = new Date();
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + EXPIRY_WARNING_DAYS);

    const lowStockItems = products.filter(p => p.quantity <= LOW_STOCK_THRESHOLD);
    const expiringItems = products.filter(p => {
        if (!p.expiryDate) return false;
        const expDate = new Date(p.expiryDate);
        return expDate <= warningDate;
    });

    const expiredItems = products.filter(p => {
        if (!p.expiryDate) return false;
        return new Date(p.expiryDate) < today;
    });

    if (lowStockItems.length === 0 && expiringItems.length === 0) {
        return (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-900/20">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Info className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Inventory Status Healthy</h3>
                        <div className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
                            <p>No low stock or expiring items detected.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {expiredItems.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Expired Items ({expiredItems.length})</h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                <ul className="list-disc pl-5 space-y-1">
                                    {expiredItems.slice(0, 3).map(item => (
                                        <li key={item.id}>{item.name} (Batch: {item.batchNumber}) - Expired on {item.expiryDate}</li>
                                    ))}
                                    {expiredItems.length > 3 && <li>...and {expiredItems.length - 3} more</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {expiringItems.length > 0 && expiringItems.length !== expiredItems.length && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Expiring Soon ({expiringItems.length - expiredItems.length})</h3>
                            <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                                <p>Items expiring within {EXPIRY_WARNING_DAYS} days. Please verify batches on the shelf.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {lowStockItems.length > 0 && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Info className="h-5 w-5 text-blue-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Low Stock Alert ({lowStockItems.length})</h3>
                            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                <ul className="list-disc pl-5 space-y-1">
                                    {lowStockItems.slice(0, 3).map(item => (
                                        <li key={item.id}>{item.name} - Only {item.quantity} left</li>
                                    ))}
                                    {lowStockItems.length > 3 && <li>...and {lowStockItems.length - 3} more</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
