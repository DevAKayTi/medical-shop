<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Shop;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
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
            // Mapping category names to their DB IDs for this shop
            $categories = Category::where('shop_id', $shop->id)->get()->keyBy('name');

            if ($categories->isEmpty()) {
                $this->command->warn("No categories found for shop {$shop->name}. Skipping products.");
                continue;
            }

            // A standard list of products
            $products = [
                [
                    'name' => 'Amoxicillin 500mg',
                    'category_name' => 'Antibiotics',
                    'medicine_type' => 'capsule',
                    'unit' => 'strip',
                    'purchase_price' => 1200,
                    'mrp' => 1500,
                    'is_controlled_drug' => true,
                    'prescription_required' => true,
                ],
                [
                    'name' => 'Paracetamol 500mg',
                    'category_name' => 'Pain Relievers',
                    'medicine_type' => 'tablet',
                    'unit' => 'strip',
                    'purchase_price' => 300,
                    'mrp' => 500,
                    'is_controlled_drug' => false,
                    'prescription_required' => false,
                ],
                [
                    'name' => 'Ibuprofen 400mg',
                    'category_name' => 'Pain Relievers',
                    'medicine_type' => 'tablet',
                    'unit' => 'strip',
                    'purchase_price' => 450,
                    'mrp' => 700,
                    'is_controlled_drug' => false,
                    'prescription_required' => false,
                ],
                [
                    'name' => 'Vitamin C 1000mg',
                    'category_name' => 'Vitamins & Supplements',
                    'medicine_type' => 'tablet',
                    'unit' => 'bottle',
                    'purchase_price' => 4500,
                    'mrp' => 6000,
                    'is_controlled_drug' => false,
                    'prescription_required' => false,
                ],
                [
                    'name' => 'Cough Syrup 100ml',
                    'category_name' => 'Cold & Cough',
                    'medicine_type' => 'syrup',
                    'unit' => 'bottle',
                    'purchase_price' => 2000,
                    'mrp' => 2800,
                    'is_controlled_drug' => false,
                    'prescription_required' => false,
                ],
                [
                    'name' => 'Digital Thermometer',
                    'category_name' => 'Equipment & Devices',
                    'medicine_type' => 'other',
                    'unit' => 'piece',
                    'purchase_price' => 8000,
                    'mrp' => 12000,
                    'is_controlled_drug' => false,
                    'prescription_required' => false,
                ],
                [
                    'name' => 'Ceftriaxone 1g',
                    'category_name' => 'Antibiotics',
                    'medicine_type' => 'injection',
                    'unit' => 'vial',
                    'purchase_price' => 2500,
                    'mrp' => 4000,
                    'is_controlled_drug' => true,
                    'prescription_required' => true,
                ]
            ];

            foreach ($products as $p) {
                // Ensure the category exists in the shop, fallback to the first category if a mismatch happens
                $categoryId = $categories->has($p['category_name']) 
                    ? $categories[$p['category_name']]->id 
                    : $categories->first()->id;

                Product::firstOrCreate(
                    [
                        'shop_id' => $shop->id,
                        'name' => $p['name']
                    ],
                    [
                        'category_id' => $categoryId,
                        'generic_name' => $p['name'],
                        'barcode' => '885' . rand(10000000, 99999999),
                        'sku' => 'SKU-' . strtoupper(Str::random(6)),
                        'medicine_type' => $p['medicine_type'],
                        'manufacturer' => 'Generic Pharma',
                        'unit' => $p['unit'],
                        'purchase_price' => $p['purchase_price'],
                        'mrp' => $p['mrp'],
                        'tax_rate' => 0,
                        'is_controlled_drug' => $p['is_controlled_drug'],
                        'prescription_required' => $p['prescription_required'],
                        'description' => 'Standard product seeded by system.',
                        'is_active' => true,
                    ]
                );
            }

            $this->command->info("Products seeded successfully for {$shop->name}.");
        }
    }
}
