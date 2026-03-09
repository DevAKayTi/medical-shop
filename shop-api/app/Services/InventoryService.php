<?php

namespace App\Services;

use App\Models\InventoryLedger;
use App\Models\ProductBatch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventoryService
{
    /**
     * Adjust stock for a specific batch and record it in the ledger.
     */
    public function adjustStock(
        string $shopId,
        string $productId,
        ?string $batchId,
        int $quantity,
        string $type, // credit (increase) | debit (decrease)
        string $referenceType,
        ?string $referenceId = null,
        ?string $notes = null,
        ?string $userId = null
    ): void {
        DB::transaction(function () use ($shopId, $productId, $batchId, $quantity, $type, $referenceType, $referenceId, $notes, $userId) {
            $currentBalance = 0;

            if ($batchId) {
                $batch = ProductBatch::where('id', $batchId)->where('shop_id', $shopId)->firstOrFail();
                $currentBalance = $batch->quantity;

                if ($type === 'credit') {
                    $batch->increment('quantity', $quantity);
                } else {
                    $batch->decrement('quantity', $quantity);
                }
                
                $balanceAfter = $batch->fresh()->quantity;
            } else {
                // For product-level movement (if no batch specified), 
                // we calculate the total stock of all batches for that product.
                $balanceAfter = ProductBatch::where('product_id', $productId)->where('shop_id', $shopId)->sum('quantity');
            }

            InventoryLedger::create([
                'id' => Str::uuid(),
                'shop_id' => $shopId,
                'product_id' => $productId,
                'batch_id' => $batchId,
                'type' => $type,
                'quantity' => $quantity,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'balance_after' => $balanceAfter,
                'notes' => $notes,
                'created_by' => $userId,
                'created_at' => now(),
            ]);
        });
    }
}
