<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\Supplier;
use App\Models\Shop;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $shop = Shop::where('email', 'admin@shop.io')->first();
        if (!$shop) {
            $shop = Shop::first();
        }

        if (!$shop) return;

        // 1. Seed Categories
        $categories = [
            ['name' => 'Antibiotics',       'slug' => 'antibiotics'],
            ['name' => 'Pain Relievers',     'slug' => 'pain-relievers'],
            ['name' => 'Vitamins',           'slug' => 'vitamins'],
            ['name' => 'First Aid',          'slug' => 'first-aid'],
            ['name' => 'Medical Equipment',  'slug' => 'medical-equipment'],
        ];

        $categoryModels = [];
        foreach ($categories as $cat) {
            $categoryModels[] = Category::create([
                'shop_id'   => $shop->id,
                'name'      => $cat['name'],
                'slug'      => $cat['slug'],
                'is_active' => true,
            ]);
        }

        // 2. Seed Suppliers
        $suppliers = [
            ['name' => 'Global Pharma',        'contact' => 'John Smith', 'phone' => '+95 9 123 4567'],
            ['name' => 'MedLine Distribution',  'contact' => 'Jane Doe',   'phone' => '+95 9 765 4321'],
            ['name' => 'HealthFirst Supplies',  'contact' => 'Mike Ross',  'phone' => '+95 9 999 8888'],
        ];

        $supplierModels = [];
        foreach ($suppliers as $sup) {
            $supplierModels[] = Supplier::create([
                'shop_id'        => $shop->id,
                'name'           => $sup['name'],
                'contact_person' => $sup['contact'],
                'phone'          => $sup['phone'],
                'email'          => strtolower(str_replace(' ', '.', $sup['name'])) . '@example.com',
                'is_active'      => true,
            ]);
        }

        // 3. Seed Products (supplier is tracked at the BATCH level now, not product level)
        $products = [
            [
                'name'                  => 'Paracetamol 500mg',
                'generic_name'          => 'Acetaminophen',
                'category_idx'          => 1, // Pain Relievers
                'batch_suppliers'       => [0, 1], // Batch 1: Global Pharma, Batch 2: MedLine
                'medicine_type'         => 'tablet',
                'unit'                  => 'strips',
                'mrp'                   => 12.50,
                'purchase_price'        => 8.00,
                'selling_price'         => 10.00,
                'tax_rate'              => 5,
            ],
            [
                'name'                  => 'Amoxicillin 250mg',
                'generic_name'          => 'Amoxicillin',
                'category_idx'          => 0, // Antibiotics
                'batch_suppliers'       => [1, 2], // Batch 1: MedLine, Batch 2: HealthFirst
                'medicine_type'         => 'capsule',
                'unit'                  => 'strips',
                'mrp'                   => 25.00,
                'purchase_price'        => 15.00,
                'selling_price'         => 20.00,
                'tax_rate'              => 7,
                'prescription_required' => true,
            ],
            [
                'name'                  => 'Vitamin C 1000mg',
                'generic_name'          => 'Ascorbic Acid',
                'category_idx'          => 2, // Vitamins
                'batch_suppliers'       => [2, 0], // Batch 1: HealthFirst, Batch 2: Global Pharma
                'medicine_type'         => 'tablet',
                'unit'                  => 'bottles',
                'mrp'                   => 45.00,
                'purchase_price'        => 30.00,
                'selling_price'         => 38.00,
                'tax_rate'              => 2,
            ],
            [
                'name'                  => 'Band-Aids (Assorted)',
                'generic_name'          => 'Adhesive Bandages',
                'category_idx'          => 3, // First Aid
                'batch_suppliers'       => [0, 0], // Both batches: Global Pharma
                'medicine_type'         => 'other',
                'unit'                  => 'pieces',
                'mrp'                   => 5.00,
                'purchase_price'        => 2.00,
                'selling_price'         => 3.50,
                'tax_rate'              => 0,
            ],
            [
                'name'                  => 'Digital Thermometer',
                'generic_name'          => 'Thermometer',
                'category_idx'          => 4, // Medical Equipment
                'batch_suppliers'       => [1, 2], // Batch 1: MedLine, Batch 2: HealthFirst
                'medicine_type'         => 'other',
                'unit'                  => 'pieces',
                'mrp'                   => 150.00,
                'purchase_price'        => 80.00,
                'selling_price'         => 120.00,
                'tax_rate'              => 5,
            ],
        ];

        foreach ($products as $prod) {
            $product = Product::create([
                'shop_id'               => $shop->id,
                'category_id'           => $categoryModels[$prod['category_idx']]->id,
                'name'                  => $prod['name'],
                'generic_name'          => $prod['generic_name'],
                'barcode'               => '885' . rand(10000000, 99999999),
                'sku'                   => 'MED-' . strtoupper(Str::random(6)),
                'medicine_type'         => $prod['medicine_type'],
                'unit'                  => $prod['unit'],
                'mrp'                   => $prod['mrp'],
                'purchase_price'        => $prod['purchase_price'],
                'selling_price'         => $prod['selling_price'],
                'tax_rate'              => $prod['tax_rate'],
                'prescription_required' => $prod['prescription_required'] ?? false,
                'is_active'             => true,
            ]);

            // Batch 1: Expiring soon — linked to first supplier
            ProductBatch::create([
                'shop_id'        => $shop->id,
                'product_id'     => $product->id,
                'supplier_id'    => $supplierModels[$prod['batch_suppliers'][0]]->id,
                'batch_number'   => 'B-' . rand(100, 999) . '-' . date('Y'),
                'expiry_date'    => now()->addMonths(2)->format('Y-m-d'),
                'quantity'       => rand(5, 15),
                'purchase_price' => $prod['purchase_price'],
                'mrp'            => $prod['mrp'],
                'is_active'      => true,
            ]);

            // Batch 2: Plenty of shelf life — linked to second supplier
            ProductBatch::create([
                'shop_id'        => $shop->id,
                'product_id'     => $product->id,
                'supplier_id'    => $supplierModels[$prod['batch_suppliers'][1]]->id,
                'batch_number'   => 'B-' . rand(100, 999) . '-' . (date('Y') + 1),
                'expiry_date'    => now()->addYears(2)->format('Y-m-d'),
                'quantity'       => rand(50, 200),
                'purchase_price' => $prod['purchase_price'],
                'mrp'            => $prod['mrp'],
                'is_active'      => true,
            ]);
        }
    }
}
