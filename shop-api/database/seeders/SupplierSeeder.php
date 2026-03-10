<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Shop;
use App\Models\Supplier;
use Illuminate\Support\Str;

class SupplierSeeder extends Seeder
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

        // Mock suppliers
        $suppliers = [
            [
                'name' => 'Metro Medical Suppliers',
                'contact_person' => 'U Aung Kyaw',
                'phone' => '09123456781',
                'email' => 'sales@metromedical.com',
                'address' => '12 Baho Road, Yangon',
            ],
            [
                'name' => 'First Health Distribution',
                'contact_person' => 'Daw Thida',
                'phone' => '09987654322',
                'email' => 'info@firsthealthdist.com',
                'address' => '45 Insein Road, Yangon',
            ],
            [
                'name' => 'Global Pharma Co.',
                'contact_person' => 'Mr. John Smith',
                'phone' => '09776655443',
                'email' => 'contact@globalpharma.com',
                'address' => '88 Pyay Road, Yangon',
            ]
        ];

        foreach ($shops as $shop) {
            foreach ($suppliers as $data) {
                Supplier::firstOrCreate(
                    [
                        'shop_id' => $shop->id,
                        'email' => $data['email'] // use email as unique constraint per shop
                    ],
                    [
                        'name' => $data['name'],
                        'contact_person' => $data['contact_person'],
                        'phone' => $data['phone'],
                        'address' => $data['address'],
                        'is_active' => true,
                    ]
                );
            }
            $this->command->info("Suppliers seeded successfully for {$shop->name}.");
        }
    }
}
