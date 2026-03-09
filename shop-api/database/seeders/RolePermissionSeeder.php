<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Roles: Owner, Manager, Staff
     * Owner → one per shop, full shop access
     * Manager → manage products, sales, staff
     * Staff → basic POS operations only
     */
    public function run(): void
    {
        // ── 1. Permissions ──────────────────────────────────────────
        $permissions = [
            // Product / Inventory
            ['name' => 'Create Product',    'slug' => 'create-product',    'module' => 'Catalog'],
            ['name' => 'Read Product',      'slug' => 'read-product',      'module' => 'Catalog'],
            ['name' => 'Update Product',    'slug' => 'update-product',    'module' => 'Catalog'],
            ['name' => 'Delete Product',    'slug' => 'delete-product',    'module' => 'Catalog'],

            // Sales / POS
            ['name' => 'Create Sale',       'slug' => 'create-sale',       'module' => 'Sales'],
            ['name' => 'Read Sale',         'slug' => 'read-sale',         'module' => 'Sales'],
            ['name' => 'Refund Sale',        'slug' => 'refund-sale',       'module' => 'Sales'],

            // Staff management
            ['name' => 'Create Staff',      'slug' => 'create-staff',      'module' => 'Staff'],
            ['name' => 'Read Staff',        'slug' => 'read-staff',        'module' => 'Staff'],
            ['name' => 'Update Staff',      'slug' => 'update-staff',      'module' => 'Staff'],
            ['name' => 'Delete Staff',      'slug' => 'delete-staff',      'module' => 'Staff'],

            // Reports
            ['name' => 'View Reports',      'slug' => 'view-reports',      'module' => 'Reports'],

            // Shop Settings
            ['name' => 'Manage Settings',   'slug' => 'manage-settings',   'module' => 'Settings'],
        ];

        $perms = [];
        foreach ($permissions as $p) {
            $perms[$p['slug']] = Permission::firstOrCreate(['slug' => $p['slug']], $p);
        }

        // ── 2. Roles ─────────────────────────────────────────────────
        $admin = Role::firstOrCreate(['slug' => 'admin'], [
            'name'        => 'Admin',
            'slug'        => 'admin',
            'description' => 'Full control over the shop. One admin per shop.',
        ]);

        $manager = Role::firstOrCreate(['slug' => 'manager'], [
            'name'        => 'Manager',
            'slug'        => 'manager',
            'description' => 'Manage products, sales, staff and view reports.',
        ]);

        $staff = Role::firstOrCreate(['slug' => 'staff'], [
            'name'        => 'Staff',
            'slug'        => 'staff',
            'description' => 'Day-to-day POS operations (sales only).',
        ]);

        // ── 3. Assign permissions ────────────────────────────────────

        // Admin → everything
        $admin->permissions()->sync(Permission::pluck('id')->toArray());

        // Manager → all except delete staff / manage settings
        $manager->permissions()->sync([
            $perms['create-product']->id,
            $perms['read-product']->id,
            $perms['update-product']->id,
            $perms['delete-product']->id,
            $perms['create-sale']->id,
            $perms['read-sale']->id,
            $perms['refund-sale']->id,
            $perms['create-staff']->id,
            $perms['read-staff']->id,
            $perms['update-staff']->id,
            $perms['view-reports']->id,
        ]);

        // Staff → POS sales + read products
        $staff->permissions()->sync([
            $perms['read-product']->id,
            $perms['create-sale']->id,
            $perms['read-sale']->id,
        ]);
    }
}
