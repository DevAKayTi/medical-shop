<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Shop;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Support\Str;

class PurchaseSeeder extends Seeder
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $shops = Shop::all();

        if ($shops->isEmpty()) {
            $this->command->warn('No shops found. Please run ShopSeeder first.');
            return;
        }

        foreach ($shops as $shop) {
            $suppliers = Supplier::where('shop_id', $shop->id)->get();
            $products = Product::where('shop_id', $shop->id)->get();
            $admin = User::where('shop_id', $shop->id)->whereHas('roles', fn($q) => $q->where('slug', 'admin'))->first();

            if ($suppliers->isEmpty() || $products->isEmpty()) {
                $this->command->warn("Missing suppliers or products for shop {$shop->name}. Skipping purchases.");
                continue;
            }

            // Create 2 historical purchases per shop
            for ($i = 0; $i < 2; $i++) {
                $supplier = $suppliers->random();
                
                $purchase = Purchase::create([
                    'shop_id' => $shop->id,
                    'supplier_id' => $supplier->id,
                    'purchase_number' => 'PO-' . now()->format('Ymd') . '-' . rand(1000, 9999),
                    'status' => 'received',
                    'subtotal' => 0,
                    'discount' => 0,
                    'tax' => 0,
                    'total' => 0,
                    'purchased_at' => now()->subDays(rand(10, 60)),
                    'received_at' => now()->subDays(rand(1, 9)),
                    'notes' => 'Seeded initial inventory purchase',
                    'created_by' => $admin ? $admin->id : null,
                ]);

                // Create items and batches
                $selectedProducts = $products->random(rand(2, 5));
                $purchaseTotal = 0;

                foreach ($selectedProducts as $product) {
                    $qty = rand(50, 200);
                    $totalItemCost = $product->purchase_price * $qty;
                    $purchaseTotal += $totalItemCost;

                    // 1. Create Product Batch with 0 quantity (adjustStock will increment)
                    $batch = ProductBatch::create([
                        'shop_id' => $shop->id,
                        'product_id' => $product->id,
                        'supplier_id' => $supplier->id,
                        'batch_number' => 'BATCH-' . strtoupper(Str::random(6)),
                        'manufacture_date' => now()->subMonths(rand(2, 6)),
                        'expiry_date' => now()->addMonths(rand(12, 36)),
                        'quantity' => 0, 
                        'purchase_price' => $product->purchase_price,
                        'selling_price' => $product->mrp,
                        'mrp' => $product->mrp,
                        'is_active' => true,
                    ]);

                    // 2. Record stock adjustment (this handles quantity increment AND ledger entry)
                    $this->inventoryService->adjustStock(
                        $shop->id,
                        $product->id,
                        $batch->id,
                        $qty,
                        'credit',
                        'purchase',
                        $purchase->id,
                        "Initial seeded purchase #{$purchase->purchase_number}",
                        $admin ? $admin->id : null
                    );

                    // 2. Create Purchase Item linking the batch
                    PurchaseItem::create([
                        'shop_id' => $shop->id,
                        'purchase_id' => $purchase->id,
                        'product_id' => $product->id,
                        'batch_id' => $batch->id,
                        'quantity' => $qty,
                        'purchase_price' => $product->purchase_price,
                        'mrp' => $product->mrp,
                        'total' => $totalItemCost,
                        'batch_number' => $batch->batch_number,
                        'manufacture_date' => $batch->manufacture_date,
                        'expiry_date' => $batch->expiry_date,
                    ]);
                }

                // Update purchase totals
                $purchase->update([
                    'subtotal' => $purchaseTotal,
                    'total' => $purchaseTotal,
                ]);
            }

            $this->command->info("Purchases, items, and batches seeded successfully for {$shop->name}.");
        }
    }
}
