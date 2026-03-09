<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use App\Models\Shop;
use App\Models\ShopSetting;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Category;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Customer;
use App\Models\CashRegister;
use App\Models\ShiftSession;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\InventoryLedger;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\DailySalesSummary;
use App\Models\MonthlySalesSummary;
use App\Models\ProductSalesSummary;
use App\Models\InventorySnapshot;
use App\Models\AuditLog;
use App\Models\LoginLog;
use App\Models\ActivityLog;
use Faker\Factory as Faker;

class RealisticDatabaseSeeder extends Seeder
{
    /**
     * Run the comprehensive realistic seeder.
     */
    public function run(): void
    {
        $faker = Faker::create();
        $this->command->info("Starting Realistic Database Seeding...");

        // 1. Roles & Permissions (Preserve or call existing)
        $this->call(RolePermissionSeeder::class);
        $adminRole = Role::where('slug', 'admin')->first();
        $managerRole = Role::where('slug', 'manager')->first();
        $staffRole = Role::where('slug', 'staff')->first();

        // 2. Shops & Settings
        $this->command->info("Seeding Shops and Settings...");
        $shops = [];
        $shopData = [
            ['name' => 'Rose Life Pharmacy', 'email' => 'contact@roselife.com', 'city' => 'Yangon'],
            ['name' => 'Heal-All Meds', 'email' => 'info@healall.com', 'city' => 'Mandalay'],
        ];

        foreach ($shopData as $data) {
            $shop = Shop::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $faker->phoneNumber,
                'address' => $faker->address,
                'city' => $data['city'],
                'country' => 'Myanmar',
                'slug' => Str::slug($data['name']),
                'status' => 'active',
                'approved_at' => now(),
            ]);
            $shops[] = $shop;

            ShopSetting::create([
                'shop_id' => $shop->id,
                'currency' => 'MMK',
                'tax_rate' => 5.00,
                'invoice_prefix' => 'INV-',
                'invoice_counter' => 1000,
                'low_stock_threshold' => 10,
                'timezone' => 'Asia/Yangon',
                'receipt_footer' => "Thank you for visiting " . $shop->name,
            ]);
        }

        foreach ($shops as $shop) {
            $this->command->info("Populating data for Shop: " . $shop->name);

            // 3. Users
            $owner = User::factory()->create([
                'shop_id' => $shop->id,
                'name' => 'Owner of ' . $shop->name,
                'email' => 'owner' . ($shop->id === $shops[0]->id ? '' : '2') . '@shop.io',
            ]);
            $owner->roles()->attach($adminRole->id);

            $manager = User::factory()->create([
                'shop_id' => $shop->id,
                'name' => 'Manager ' . $shop->name,
                'email' => 'manager' . ($shop->id === $shops[0]->id ? '' : '2') . '@shop.io',
            ]);
            $manager->roles()->attach($managerRole->id);

            $staff = User::factory()->create([
                'shop_id' => $shop->id,
                'name' => 'Staff ' . $shop->name,
                'email' => 'staff' . ($shop->id === $shops[0]->id ? '1' : '2') . '@shop.io',
            ]);
            $staff->roles()->attach($staffRole->id);

            $allUsers = [$owner, $manager, $staff];

            // 4. Categories
            $categories = ['Antibiotics', 'Pain Relievers', 'Vitamins', 'Cardiology', 'First Aid', 'Equipment'];
            $catModels = [];
            foreach ($categories as $cat) {
                $catModels[] = Category::create([
                    'shop_id' => $shop->id,
                    'name' => $cat,
                    'slug' => Str::slug($cat),
                    'is_active' => true,
                ]);
            }

            // 5. Suppliers
            $suppliers = [];
            for ($i = 0; $i < 4; $i++) {
                $suppliers[] = Supplier::create([
                    'shop_id' => $shop->id,
                    'name' => $faker->company . " Pharma",
                    'contact_person' => $faker->name,
                    'phone' => $faker->phoneNumber,
                    'email' => $faker->companyEmail,
                    'address' => $faker->address,
                    'is_active' => true,
                ]);
            }

            // 6. Products
            $medicineNames = [
                ['name' => 'Amoxicillin 500mg', 'type' => 'capsule', 'cat' => 0],
                ['name' => 'Paracetamol 500mg', 'type' => 'tablet', 'cat' => 1],
                ['name' => 'Ibuprofen 400mg', 'type' => 'tablet', 'cat' => 1],
                ['name' => 'Vitamin C 1000mg', 'type' => 'tablet', 'cat' => 2],
                ['name' => 'Amlodipine 5mg', 'type' => 'tablet', 'cat' => 3],
                ['name' => 'Bandages Pack', 'type' => 'other', 'cat' => 4],
                ['name' => 'Hand Sanitizer', 'type' => 'liquid', 'cat' => 4],
                ['name' => 'Face Masks (50pcs)', 'type' => 'other', 'cat' => 4],
                ['name' => 'Digital Thermometer', 'type' => 'other', 'cat' => 5],
                ['name' => 'Blood Pressure Mon', 'type' => 'other', 'cat' => 5],
            ];

            $productModels = [];
            foreach ($medicineNames as $m) {
                $purchasePrice = rand(500, 5000);
                $sellingPrice = $purchasePrice * 1.3;
                $productModels[] = Product::create([
                    'shop_id' => $shop->id,
                    'category_id' => $catModels[$m['cat']]->id,
                    'name' => $m['name'],
                    'barcode' => '885' . rand(10000000, 99999999),
                    'sku' => 'SKU-' . strtoupper(Str::random(6)),
                    'medicine_type' => $m['type'],
                    'unit' => 'pcs',
                    'mrp' => $sellingPrice * 1.1,
                    'purchase_price' => $purchasePrice,
                    'selling_price' => $sellingPrice,
                    'tax_rate' => 5,
                    'is_active' => true,
                ]);
            }

            // 7. Purchases & Batches
            $this->command->info("Seeding Purchases and Batches for " . $shop->name);
            foreach ($suppliers as $sup) {
                $purchase = Purchase::create([
                    'shop_id' => $shop->id,
                    'supplier_id' => $sup->id,
                    'purchase_number' => 'PO-' . rand(1000, 9999),
                    'status' => 'received',
                    'subtotal' => 0,
                    'total' => 0,
                    'purchased_at' => now()->subDays(100),
                    'received_at' => now()->subDays(98),
                    'created_by' => $owner->id,
                ]);

                $pTotal = 0;
                $subProducts = collect($productModels)->random(3);
                foreach ($subProducts as $prod) {
                    $qty = rand(50, 200);
                    $price = $prod->purchase_price;
                    $total = $qty * $price;
                    $pTotal += $total;

                    $batch = ProductBatch::create([
                        'shop_id' => $shop->id,
                        'product_id' => $prod->id,
                        'supplier_id' => $sup->id,
                        'batch_number' => 'BATCH-' . strtoupper(Str::random(5)),
                        'expiry_date' => now()->addMonths(rand(6, 24)),
                        'quantity' => $qty,
                        'purchase_price' => $price,
                        'mrp' => $prod->mrp,
                        'is_active' => true,
                    ]);

                    PurchaseItem::create([
                        'shop_id' => $shop->id,
                        'purchase_id' => $purchase->id,
                        'product_id' => $prod->id,
                        'batch_id' => $batch->id,
                        'batch_number' => $batch->batch_number,
                        'expiry_date' => $batch->expiry_date,
                        'quantity' => $qty,
                        'purchase_price' => $price,
                        'total' => $total,
                        'mrp' => $prod->mrp,
                    ]);

                    InventoryLedger::create([
                        'shop_id' => $shop->id,
                        'product_id' => $prod->id,
                        'batch_id' => $batch->id,
                        'type' => 'credit',
                        'quantity' => $qty,
                        'reference_type' => 'purchase',
                        'reference_id' => $purchase->id,
                        'balance_after' => $qty,
                        'notes' => "Initial Stock Purchase",
                        'created_by' => $owner->id,
                    ]);
                }
                $purchase->update([
                    'subtotal' => $pTotal,
                    'total' => $pTotal,
                ]);
            }

            // 8. Customers
            $this->command->info("Seeding Customers for " . $shop->name);
            $customers = [];
            for ($i = 0; $i < 15; $i++) {
                $customers[] = Customer::create([
                    'shop_id' => $shop->id,
                    'name' => $faker->name,
                    'phone' => $faker->phoneNumber,
                    'email' => $faker->safeEmail,
                ]);
            }

            // 9. Registers & Shifts
            $register = CashRegister::create([
                'shop_id' => $shop->id,
                'name' => 'Counter 1',
                'is_active' => true,
            ]);

            // 10. Simulate 60 Days of Sales
            $this->command->info("Simulating 60 days of historical Sales for " . $shop->name);
            for ($day = 60; $day >= 0; $day--) {
                $date = now()->subDays($day);
                
                // Shift
                $shiftUser = $allUsers[array_rand($allUsers)];
                $session = ShiftSession::create([
                    'shop_id' => $shop->id,
                    'register_id' => $register->id,
                    'user_id' => $shiftUser->id,
                    'opening_cash' => 100000,
                    'status' => 'closed',
                    'opened_at' => $date->copy()->startOfDay()->addHours(8),
                    'closed_at' => $date->copy()->startOfDay()->addHours(20),
                ]);

                $dailySalesTotal = 0;
                $dailyTransCount = rand(5, 15);

                for ($s = 0; $s < $dailyTransCount; $s++) {
                    $customer = (rand(1, 10) > 3) ? $customers[array_rand($customers)] : null;
                    $saleTime = $date->copy()->startOfDay()->addHours(rand(9, 19))->addMinutes(rand(0, 59));

                    $saleItemsData = [];
                    $subtotal = 0;
                    $tax = 0;
                    
                    $numItems = rand(1, 3);
                    $saleProducts = collect($productModels)->random($numItems);

                    foreach ($saleProducts as $prod) {
                        $qty = rand(1, 5);
                        $batch = ProductBatch::where('product_id', $prod->id)->where('quantity', '>', 0)->first();
                        if (!$batch) continue;

                        $itemTotal = $qty * $prod->selling_price;
                        $itemTax = round($itemTotal * 0.05, 2);
                        
                        $saleItemsData[] = [
                            'product' => $prod,
                            'batch' => $batch,
                            'qty' => $qty,
                            'price' => $prod->selling_price,
                            'tax' => $itemTax,
                            'total' => round($itemTotal + $itemTax, 2)
                        ];

                        $subtotal += $itemTotal;
                        $tax += $itemTax;
                        
                        // Deduct stock
                        $batch->decrement('quantity', $qty);

                        // Ledger
                        InventoryLedger::create([
                            'shop_id' => $shop->id,
                            'product_id' => $prod->id,
                            'batch_id' => $batch->id,
                            'type' => 'debit',
                            'quantity' => $qty,
                            'reference_type' => 'sale',
                            'balance_after' => $batch->quantity,
                            'notes' => "POS Sale",
                            'created_by' => $shiftUser->id,
                            'created_at' => $saleTime,
                        ]);

                        // Summary
                        $ps = ProductSalesSummary::firstOrCreate(
                            ['shop_id' => $shop->id, 'product_id' => $prod->id, 'summary_date' => $date->toDateString()],
                            ['qty_sold' => 0, 'gross_revenue' => 0, 'net_revenue' => 0]
                        );
                        $ps->increment('qty_sold', $qty);
                        $ps->increment('gross_revenue', $itemTotal + $itemTax);
                        $ps->increment('net_revenue', $itemTotal);
                    }

                    if (empty($saleItemsData)) continue;

                    $total = $subtotal + $tax;
                    $invoiceNum = "INV-" . $saleTime->format('Ymd') . "-" . str_pad($s, 4, '0', STR_PAD_LEFT);

                    $sale = Sale::create([
                        'shop_id' => $shop->id,
                        'invoice_number' => $invoiceNum,
                        'customer_id' => $customer?->id,
                        'session_id' => $session->id,
                        'register_id' => $register->id,
                        'cashier_id' => $shiftUser->id,
                        'subtotal' => $subtotal,
                        'tax' => $tax,
                        'total' => $total,
                        'amount_paid' => $total,
                        'status' => 'completed',
                        'sold_at' => $saleTime,
                    ]);

                    foreach ($saleItemsData as $item) {
                        SaleItem::create([
                            'shop_id' => $shop->id,
                            'sale_id' => $sale->id,
                            'product_id' => $item['product']->id,
                            'batch_id' => $item['batch']->id,
                            'quantity' => $item['qty'],
                            'unit_price' => $item['price'],
                            'tax' => $item['tax'],
                            'total' => $item['total'],
                        ]);
                    }

                    SalePayment::create([
                        'shop_id' => $shop->id,
                        'sale_id' => $sale->id,
                        'method' => rand(1, 10) > 7 ? 'card' : 'cash',
                        'amount' => $total,
                        'paid_at' => $saleTime,
                    ]);

                    if ($customer) {
                        $customer->increment('loyalty_points', floor($total / 1000));
                    }

                    $dailySalesTotal += $total;
                }

                $session->update([
                    'closing_cash' => 100000 + $dailySalesTotal,
                    'total_sales' => $dailySalesTotal,
                    'total_refunds' => 0,
                ]);

                // Daily Summary
                DailySalesSummary::create([
                    'shop_id' => $shop->id,
                    'summary_date' => $date->toDateString(),
                    'total_sales' => $dailySalesTotal,
                    'total_transactions' => $dailyTransCount,
                    'net_revenue' => $dailySalesTotal / 1.05,
                ]);
            }

            // Monthly Summary
            $monthlySales = Sale::where('shop_id', $shop->id)->whereBetween('sold_at', [now()->subDays(60), now()])->sum('total');
            MonthlySalesSummary::create([
                'shop_id' => $shop->id,
                'year' => now()->year,
                'month' => now()->month,
                'total_sales' => $monthlySales,
                'total_transactions' => Sale::where('shop_id', $shop->id)->whereBetween('sold_at', [now()->subDays(30), now()])->count(),
                'net_revenue' => $monthlySales / 1.05,
            ]);

            // 11. Final Snapshot
            foreach ($productModels as $prod) {
                InventorySnapshot::create([
                    'shop_id' => $shop->id,
                    'product_id' => $prod->id,
                    'snapshot_date' => now()->toDateString(),
                    'closing_qty' => ProductBatch::where('product_id', $prod->id)->sum('quantity'),
                ]);
            }

            // 12. Logs
            for ($i = 0; $i < 5; $i++) {
                LoginLog::create([
                    'user_type' => 'shop_user',
                    'user_id' => $allUsers[array_rand($allUsers)]->id,
                    'ip_address' => '127.0.0.1',
                    'success' => true,
                    'logged_in_at' => now()->subMinutes(rand(10, 5000)),
                ]);
            }
        }

        $this->command->info("Seeding Complete!");
    }
}
