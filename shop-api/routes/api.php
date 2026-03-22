<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ShopController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\StockAdjustmentController;
use App\Http\Controllers\Api\InventoryLedgerController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\PurchaseReturnController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ActivityLogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Auth Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:api')->group(function () {
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/revenue-details', [DashboardController::class, 'revenueDetails']);
    Route::get('/dashboard/reports', [DashboardController::class, 'reports']);
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Shop
    Route::get('/shop', [ShopController::class, 'show']);

    // User Management
    Route::apiResource('users', UserController::class);
    Route::post('users/{user}/sync-roles', [UserController::class, 'syncRoles']);

    // Inventory
    Route::apiResource('categories', CategoryController::class)->except(['show']);
    Route::apiResource('suppliers', SupplierController::class)->except(['show']);
    Route::apiResource('products', ProductController::class);
    Route::get('products/{product}/batches', [ProductController::class, 'batches']);
    Route::post('products/{product}/batches', [ProductController::class, 'storeBatch']);
    Route::put('batches/{batch}', [ProductController::class, 'updateBatch']);
    Route::delete('batches/{batch}', [ProductController::class, 'destroyBatch']);

    Route::apiResource('stock-adjustments', StockAdjustmentController::class)->only(['index', 'store']);
    Route::get('inventory-ledgers', [InventoryLedgerController::class, 'index']);

    // Purchases
    Route::apiResource('purchases', PurchaseController::class);

    // Purchase Returns
    Route::apiResource('purchase-returns', PurchaseReturnController::class)->only(['index', 'store', 'show', 'update']);
    Route::post('purchase-returns/{purchaseReturn}/complete', [PurchaseReturnController::class, 'complete']);

    // ── Customers ─────────────────────────────────────────────────────
    Route::apiResource('customers', CustomerController::class);

    // ── Cash Registers & Shift Sessions ───────────────────────────────
    Route::apiResource('cash-registers', \App\Http\Controllers\Api\CashRegisterController::class);
    Route::apiResource('shift-sessions', \App\Http\Controllers\Api\ShiftSessionController::class)->only(['index', 'store', 'show']);
    Route::post('shift-sessions/{shiftSession}/close', [\App\Http\Controllers\Api\ShiftSessionController::class, 'close']);

    // ── Sales (POS) ───────────────────────────────────────────────────
    Route::apiResource('sales', SaleController::class)->only(['index', 'store', 'show', 'destroy']);

    // Role & Permission Management
    Route::apiResource('roles', RoleController::class);
    Route::post('roles/{role}/sync-permissions', [RoleController::class, 'syncPermissions']);
    Route::apiResource('permissions', PermissionController::class);
});

