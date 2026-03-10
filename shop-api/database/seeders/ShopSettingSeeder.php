<?php

namespace Database\Seeders;

use App\Models\Shop;
use App\Models\ShopSetting;
use Illuminate\Database\Seeder;

class ShopSettingSeeder extends Seeder
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
            ShopSetting::firstOrCreate(
                ['shop_id' => $shop->id],
                [
                    'currency' => 'USD',
                    'tax_rate' => 0.00,
                    'invoice_prefix' => 'INV-',
                    'invoice_counter' => 1000,
                    'low_stock_threshold' => 10,
                    'timezone' => 'UTC',
                    'receipt_footer' => 'Thank you for your business!',
                ]
            );
        }

        $this->command->info('Shop settings seeded successfully.');
    }
}
