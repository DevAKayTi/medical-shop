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
        // ── 1. The 42 Granular Permissions ──────────────────────────
        $permissions = [
            // 1. Dashboard & Reports
            ['name' => 'View Dashboard',    'slug' => 'view-dashboard',    'module' => 'Analytics'],
            ['name' => 'View Reports',      'slug' => 'view-reports',      'module' => 'Analytics'],

            // 2. User & Role Management
            ['name' => 'Read Users',       'slug' => 'read-users',       'module' => 'Security'],
            ['name' => 'Create Users',     'slug' => 'create-users',     'module' => 'Security'],
            ['name' => 'Update Users',     'slug' => 'update-users',     'module' => 'Security'],
            ['name' => 'Delete Users',     'slug' => 'delete-users',     'module' => 'Security'],
            ['name' => 'Read Roles',       'slug' => 'read-roles',       'module' => 'Security'],
            ['name' => 'Manage Roles',     'slug' => 'manage-roles',     'module' => 'Security'],

            // 3. Shop Settings
            ['name' => 'Read Settings',    'slug' => 'read-settings',    'module' => 'Settings'],
            ['name' => 'Manage Settings',  'slug' => 'manage-settings',  'module' => 'Settings'],

            // 4. Inventory & Catalog
            ['name' => 'Read Catalog',     'slug' => 'read-catalog',     'module' => 'Inventory'],
            ['name' => 'Create Catalog',   'slug' => 'create-catalog',   'module' => 'Inventory'],
            ['name' => 'Update Catalog',   'slug' => 'update-catalog',   'module' => 'Inventory'],
            ['name' => 'Delete Catalog',   'slug' => 'delete-catalog',   'module' => 'Inventory'],

            // 5. Supplier Management
            ['name' => 'Read Suppliers',   'slug' => 'read-suppliers',   'module' => 'Inventory'],
            ['name' => 'Create Suppliers', 'slug' => 'create-suppliers', 'module' => 'Inventory'],
            ['name' => 'Update Suppliers', 'slug' => 'update-suppliers', 'module' => 'Inventory'],
            ['name' => 'Delete Suppliers', 'slug' => 'delete-suppliers', 'module' => 'Inventory'],

            // 6. Stock Operations
            ['name' => 'Read Stock',       'slug' => 'read-stock',       'module' => 'Inventory'],
            ['name' => 'Adjust Stock',     'slug' => 'adjust-stock',     'module' => 'Inventory'],

            // 7. Purchases & Returns
            ['name' => 'Read Purchases',   'slug' => 'read-purchases',   'module' => 'Purchases'],
            ['name' => 'Create Purchases', 'slug' => 'create-purchases', 'module' => 'Purchases'],
            ['name' => 'Update Purchases', 'slug' => 'update-purchases', 'module' => 'Purchases'],
            ['name' => 'Delete Purchases', 'slug' => 'delete-purchases', 'module' => 'Purchases'],
            ['name' => 'Read Returns',     'slug' => 'read-returns',     'module' => 'Purchases'],
            ['name' => 'Create Returns',   'slug' => 'create-returns',   'module' => 'Purchases'],
            ['name' => 'Complete Returns', 'slug' => 'complete-returns', 'module' => 'Purchases'],

            // 8. Cash Registers & Shifts
            ['name' => 'Read Registers',   'slug' => 'read-registers',   'module' => 'POS'],
            ['name' => 'Manage Registers', 'slug' => 'manage-registers', 'module' => 'POS'],
            ['name' => 'Read Shifts',      'slug' => 'read-shifts',      'module' => 'POS'],
            ['name' => 'Open Shift',       'slug' => 'open-shift',       'module' => 'POS'],
            ['name' => 'Close Shift',      'slug' => 'close-shift',      'module' => 'POS'],

            // 9. Sales & POS Operations
            ['name' => 'Read Sales',       'slug' => 'read-sales',       'module' => 'Sales'],
            ['name' => 'Create Sales',     'slug' => 'create-sales',     'module' => 'Sales'],
            ['name' => 'Void Sales',       'slug' => 'void-sales',       'module' => 'Sales'],
            ['name' => 'Refund Sales',     'slug' => 'refund-sales',     'module' => 'Sales'],

            // 10. Customers
            ['name' => 'Read Customers',   'slug' => 'read-customers',   'module' => 'CRM'],
            ['name' => 'Create Customers', 'slug' => 'create-customers', 'module' => 'CRM'],
            ['name' => 'Update Customers', 'slug' => 'update-customers', 'module' => 'CRM'],
            ['name' => 'Delete Customers', 'slug' => 'delete-customers', 'module' => 'CRM'],
        ];

        $perms_objects = [];
        foreach ($permissions as $p) {
            $perms_objects[$p['slug']] = Permission::updateOrCreate(['slug' => $p['slug']], $p);
        }

        // ── 2. Roles ─────────────────────────────────────────────────
        $admin = Role::updateOrCreate(['slug' => 'admin'], [
            'name' => 'Admin',
            'description' => 'Full access to all modules and configurations.',
        ]);

        $manager = Role::updateOrCreate(['slug' => 'manager'], [
            'name' => 'Manager',
            'description' => 'Full access to inventory, sales, and purchases. Limited security access.',
        ]);

        $cashier = Role::updateOrCreate(['slug' => 'cashier'], [
            'name' => 'Cashier',
            'description' => 'Restricted to POS, shift management, and basic CRM.',
        ]);

        // ── 3. Assign Permissions ────────────────────────────────────

        // Admin -> Sync all permissions
        $admin->permissions()->sync(Permission::pluck('id')->toArray());

        // Manager -> Specific operational coverage
        $manager_permissions = [
            'view-dashboard', 'view-reports',
            'read-users',
            'read-settings',
            'read-catalog', 'create-catalog', 'update-catalog',
            'read-suppliers', 'create-suppliers', 'update-suppliers',
            'read-stock', 'adjust-stock',
            'read-purchases', 'create-purchases', 'update-purchases',
            'read-returns', 'create-returns', 'complete-returns',
            'read-registers', 'read-shifts', 'open-shift', 'close-shift',
            'read-sales', 'create-sales', 'void-sales', 'refund-sales',
            'read-customers', 'create-customers', 'update-customers',
        ];

        $manager->permissions()->sync(
            Permission::whereIn('slug', $manager_permissions)->pluck('id')->toArray()
        );

        // Cashier -> Strictly POS and basic CRM
        $cashier_permissions = [
            'read-catalog',
            'read-registers', 'open-shift', 'close-shift',
            'read-sales', 'create-sales',
            'read-customers', 'create-customers', 'update-customers',
        ];

        $cashier->permissions()->sync(
            Permission::whereIn('slug', $cashier_permissions)->pluck('id')->toArray()
        );
    }
}
