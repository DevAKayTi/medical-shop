<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ShopController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Auth Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:api')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // User Management
    Route::apiResource('users', UserController::class);
    Route::post('users/{user}/sync-roles', [UserController::class, 'syncRoles']);

    // Role & Permission Management
    Route::apiResource('roles', RoleController::class);
    Route::post('roles/{role}/sync-permissions', [RoleController::class, 'syncPermissions']);
    Route::apiResource('permissions', PermissionController::class);

    // Shop Management (from shop_db)
    Route::get('shops', [ShopController::class, 'index']);
    Route::post('shops', [ShopController::class, 'store']);
    Route::get('shops/{id}', [ShopController::class, 'show']);
    Route::get('shops/{id}/approve', [\App\Http\Controllers\Api\ShopController::class, 'approve']);
    Route::get('shops/{id}/suspend', [\App\Http\Controllers\Api\ShopController::class, 'suspend']);
    Route::put('shops/{id}', [ShopController::class, 'update']);
    Route::delete('shops/{id}', [ShopController::class, 'destroy']);

    // Shop Settings
    Route::get('shops/{id}/settings', [\App\Http\Controllers\Api\ShopSettingController::class, 'show']);
    Route::put('shops/{id}/settings', [\App\Http\Controllers\Api\ShopSettingController::class, 'update']);

    // Shop Users Management
    Route::get('shop-users', [\App\Http\Controllers\Api\ShopUserController::class, 'index']);
    Route::post('shop-users', [\App\Http\Controllers\Api\ShopUserController::class, 'store']);
    Route::get('shop-users/{id}', [\App\Http\Controllers\Api\ShopUserController::class, 'show']);
    Route::put('shop-users/{id}', [\App\Http\Controllers\Api\ShopUserController::class, 'update']);
    Route::delete('shop-users/{id}', [\App\Http\Controllers\Api\ShopUserController::class, 'destroy']);
    Route::patch('shop-users/{id}/toggle-status', [\App\Http\Controllers\Api\ShopUserController::class, 'toggleStatus']);
    // activity logs
    Route::get('activity-logs', [\App\Http\Controllers\Api\ActivityLogController::class, 'index']);
});
