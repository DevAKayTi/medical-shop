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
        ]);

        // Create Users and assign Roles
        $usersData = [
            ['name' => 'Admin User', 'email' => 'admin@pos.io', 'role' => 'admin'],
            ['name' => 'Manager User', 'email' => 'manager@pos.io', 'role' => 'manager'],
            ['name' => 'Cashier User', 'email' => 'cashier@pos.io', 'role' => 'cashier'],
            ['name' => 'Viewer User', 'email' => 'viewer@pos.io', 'role' => 'viewer'],
        ];

        foreach ($usersData as $userData) {
            $user = User::factory()->create([
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
