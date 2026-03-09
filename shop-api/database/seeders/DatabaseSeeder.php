<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Setup Roles and Permissions
        $this->call([
            RolePermissionSeeder::class,
            ShopSeeder::class,
            InventorySeeder::class,
        ]);

        $shop = \App\Models\Shop::first();

        // Create Users and assign Roles
        $usersData = [
            ['name' => 'Shop Admin', 'email' => 'admin@shop.io', 'role' => 'admin'],
            ['name' => 'Shop Manager', 'email' => 'manager@shop.io', 'role' => 'manager'],
            ['name' => 'Shop Staff 1', 'email' => 'staff1@shop.io', 'role' => 'staff'],
            ['name' => 'Shop Staff 2', 'email' => 'staff2@shop.io', 'role' => 'staff'],
        ];

        foreach ($usersData as $userData) {
            $user = User::factory()->create([
                'shop_id' => $shop ? $shop->id : null,
                'name' => $userData['name'],
                'email' => $userData['email'],
                // Password is automatically 'password' from factory
            ]);

            $role = \App\Models\Role::where('slug', $userData['role'])->first();
            if ($role) {
                $user->roles()->attach($role->id);
            }
        }
    }
}
