<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Permissions
        $permissions = [
            // User CRUD
            ['name' => 'Create User', 'slug' => 'create-user', 'module' => 'Staff'],
            ['name' => 'Read User', 'slug' => 'read-user', 'module' => 'Staff'],
            ['name' => 'Update User', 'slug' => 'update-user', 'module' => 'Staff'],
            ['name' => 'Delete User', 'slug' => 'delete-user', 'module' => 'Staff'],
            // Role CRUD
            ['name' => 'Create Role', 'slug' => 'create-role', 'module' => 'Staff'],
            ['name' => 'Read Role', 'slug' => 'read-role', 'module' => 'Staff'],
            ['name' => 'Update Role', 'slug' => 'update-role', 'module' => 'Staff'],
            ['name' => 'Delete Role', 'slug' => 'delete-role', 'module' => 'Staff'],
            // Permission R (Read-Only)
            ['name' => 'Read Permission', 'slug' => 'read-permission', 'module' => 'Staff'],
        ];

        $createdPermissions = [];
        foreach ($permissions as $perm) {
            $createdPermissions[$perm['slug']] = Permission::create($perm);
        }

        // 2. Create Roles
        $admin = Role::create([
            'name' => 'Admin', 'slug' => 'admin', 'description' => 'Full system access.'
        ]);
        
        $manager = Role::create([
            'name' => 'Manager', 'slug' => 'manager', 'description' => 'Manage staff and operations.'
        ]);

        $cashier = Role::create([
            'name' => 'Cashier', 'slug' => 'cashier', 'description' => 'Process point of sale operations.'
        ]);

        $viewer = Role::create([
            'name' => 'Viewer', 'slug' => 'viewer', 'description' => 'Read-only access to system data.'
        ]);

        // 3. Assign Permissions to Roles
        // Admin gets everything
        $admin->permissions()->attach(Permission::pluck('id')->toArray());

        // Manager gets Read users/roles/permissions, plus Create/Update users
        $manager->permissions()->attach([
            $createdPermissions['read-user']->id,
            $createdPermissions['create-user']->id,
            $createdPermissions['update-user']->id,
            $createdPermissions['read-role']->id,
            $createdPermissions['read-permission']->id,
        ]);

        // Cashier/Viewer just gets read access to some basic things
        $cashier->permissions()->attach([
            $createdPermissions['read-user']->id,
        ]);

        $viewer->permissions()->attach([
            $createdPermissions['read-user']->id,
            $createdPermissions['read-role']->id,
        ]);
    }
}
