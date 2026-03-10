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
        // Setup comprehensive realistic data
        $this->call([
            // RealisticDatabaseSeeder::class,
            ShopSeeder::class,
            ShopSettingSeeder::class,
            RolePermissionSeeder::class,
            UserSeeder::class,
            CategorySeeder::class,
            SupplierSeeder::class,
            ProductSeeder::class,
            // InventoryLedgerSeeder::class,
            // StockAdjustmentSeeder::class,
            // StockTransferSeeder::class,
            PurchaseSeeder::class,
            // PurchaseReturnSeeder::class,
            // PurchaseReturnItemSeeder::class,
            CustomerSeeder::class,
            // CashRegisterSeeder::class,
            // ShiftSessionSeeder::class,
            // SaleSeeder::class,
            // SaleItemSeeder::class,
            // SalePaymentSeeder::class,
            // SalesReturnSeeder::class,
            // SalesReturnItemSeeder::class,
            // DailySalesReportSeeder::class,
            // MonthlySalesReportSeeder::class,
            // AuditLogSeeder::class,
            // InventorySnapshotSeeder::class,
            // LoginLogSeeder::class,
            // ProductSalesReportSeeder::class,
        ]);
    }
}


