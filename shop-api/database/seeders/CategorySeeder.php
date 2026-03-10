<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Shop;
use App\Models\Category;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
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

        $categories = [
            'Antibiotics',
            'Pain Relievers',
            'Vitamins & Supplements',
            'First Aid & Wound Care',
            'Cold & Cough',
            'Personal Care & Hygiene',
            'Baby Care',
            'Equipment & Devices',
            'Skin Care',
            'Digestive Health'
        ];

        foreach ($shops as $shop) {
            foreach ($categories as $categoryName) {
                Category::firstOrCreate(
                    [
                        'shop_id' => $shop->id,
                        'slug' => Str::slug($categoryName)
                    ],
                    [
                        'name' => $categoryName,
                        'is_active' => true,
                    ]
                );
            }
            $this->command->info("Categories seeded successfully for {$shop->name}.");
        }
    }
}
