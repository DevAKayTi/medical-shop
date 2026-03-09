<?php

namespace Database\Seeders;

use App\Models\Shop;
use App\Models\ShopSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ShopSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $shops = [
            [
                'name' => 'Medical Care Pharmacy',
                'email' => 'contact@medicalcare.com',
                'phone' => '09123456789',
                'address' => '123 Health St, Yangon',
                'country' => 'Myanmar',
                'city' => 'Yangon',
                'slug' => 'medical-care-pharmacy',
                'status' => 'active',
                'approved_at' => now(),
            ],
            [
                'name' => 'City Wellness Center',
                'email' => 'info@citywellness.com',
                'phone' => '09987654321',
                'address' => '456 Wellness Rd, Mandalay',
                'country' => 'Myanmar',
                'city' => 'Mandalay',
                'slug' => 'city-wellness-center',
                'status' => 'active',
                'approved_at' => now(),
            ],
        ];

        foreach ($shops as $shopData) {
            $shop = Shop::create($shopData);

            ShopSetting::create([
                'shop_id' => $shop->id,
                'currency' => 'MMK',
                'tax_rate' => 5.00,
                'invoice_prefix' => 'INV-',
                'invoice_counter' => 1000,
                'low_stock_threshold' => 15,
                'timezone' => 'Asia/Yangon',
                'receipt_footer' => 'Thank you for choosing ' . $shop->name,
            ]);
        }
    }
}
