<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Shop;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
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

        $adminRole = Role::where('slug', 'admin')->first();
        $managerRole = Role::where('slug', 'manager')->first();
        $cashierRole = Role::where('slug', 'cashier')->first();

        if (!$adminRole || !$managerRole || !$cashierRole) {
            // Attempt to seed roles if they don't exist
            $this->call(RolePermissionSeeder::class);
            $adminRole = Role::where('slug', 'admin')->first();
            $managerRole = Role::where('slug', 'manager')->first();
            $cashierRole = Role::where('slug', 'cashier')->first();
            
            if (!$adminRole || !$managerRole || !$cashierRole) {
                $this->command->warn('Roles not found. Please check RolePermissionSeeder.');
                return;
            }
        }

        foreach ($shops as $shop) {
            // 1. Admin
            $admin = User::firstOrCreate(
                ['email' => "admin@{$shop->slug}.com"],
                [
                    'shop_id' => $shop->id,
                    'name' => 'Admin User',
                    'password' => Hash::make('password'),
                    'is_active' => true,
                ]
            );
            if (!$admin->hasRole('admin')) {
                $admin->roles()->attach($adminRole->id);
            }

            // 2. Manager
            $manager = User::firstOrCreate(
                ['email' => "manager@{$shop->slug}.com"],
                [
                    'shop_id' => $shop->id,
                    'name' => 'Manager User',
                    'password' => Hash::make('password'),
                    'is_active' => true,
                ]
            );
            if (!$manager->hasRole('manager')) {
                $manager->roles()->attach($managerRole->id);
            }

            // 3. Cashier
            $cashier = User::firstOrCreate(
                ['email' => "staff@{$shop->slug}.com"],
                [
                    'shop_id' => $shop->id,
                    'name' => 'Staff User',
                    'password' => Hash::make('password'),
                    'is_active' => true,
                ]
            );
            if (!$cashier->hasRole('cashier')) {
                $cashier->roles()->attach($cashierRole->id);
            }

            $this->command->info("Users seeded successfully for {$shop->name}.");
            $this->command->info("Admin: admin@{$shop->slug}.com / password");
            $this->command->info("Manager: manager@{$shop->slug}.com / password");
            $this->command->info("Staff: staff@{$shop->slug}.com / password");
            $this->command->newLine();
        }
    }
}
