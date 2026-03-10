<?php
 
namespace Database\Seeders;
 
use App\Models\Customer;
use App\Models\Shop;
use Illuminate\Database\Seeder;
 
class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $shop = Shop::first();
        if (!$shop) {
            return;
        }
 
        $customers = [
            [
                'shop_id' => $shop->id,
                'name' => 'Wai Yan Aung',
                'phone' => '09791234567',
                'email' => 'waiyan@gmail.com',
                'date_of_birth' => '1990-05-15',
                'gender' => 'male',
                'address' => 'No 12, Pyay Road, Kamayut, Yangon',
                'loyalty_points' => 0,
                'total_spent' => 0.00,
            ],
            [
                'shop_id' => $shop->id,
                'name' => 'Wai Yan Aung',
                'phone' => '09791234568',
                'email' => 'waiyann@gmail.com',
                'date_of_birth' => '1990-05-15',
                'gender' => 'male',
                'address' => 'No 12, Pyay Road, Kamayut, Yangon',
                'loyalty_points' => 0,
                'total_spent' => 0.00,
            ],
            [
                'shop_id' => $shop->id,
                'name' => 'Hnin Phyu',
                'phone' => '09450987654',
                'email' => 'hninphyu@yahoo.com',
                'date_of_birth' => '1995-10-22',
                'gender' => 'female',
                'address' => '54th Street, Chan Aye Thar San, Mandalay',
                'loyalty_points' => 0,
                'total_spent' => 0.00,
            ],
            [
                'shop_id' => $shop->id,
                'name' => 'Kyaw Kyaw',
                'phone' => '09254321098',
                'email' => 'kyawkyaw@outlook.com',
                'date_of_birth' => '1988-02-10',
                'gender' => 'male',
                'address' => 'Bogyoke Road, Mawlamyine',
                'loyalty_points' => 0,
                'total_spent' => 0.00,
            ],
            [
                'shop_id' => $shop->id,
                'name' => 'Su Myat Noe',
                'phone' => '09695554443',
                'email' => 'sumyat@gmail.com',
                'date_of_birth' => '1992-12-05',
                'gender' => 'female',
                'address' => 'Main Street, Taunggyi',
                'loyalty_points' => 0,
                'total_spent' => 0.00,
            ],
            [
                'shop_id' => $shop->id,
                'name' => 'Min Thant',
                'phone' => '09787654321',
                'email' => 'minthant@gmail.com',
                'date_of_birth' => '1985-08-30',
                'gender' => 'male',
                'address' => 'University Avenue, Bahan, Yangon',
                'loyalty_points' => 0,
                'total_spent' => 0.00,
            ],
        ];
 
        foreach ($customers as $customerData) {
            Customer::create($customerData);
        }
    }
}
