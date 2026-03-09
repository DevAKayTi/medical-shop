<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get aggregated stats for the dashboard.
     */
    public function stats(Request $request)
    {
        $shopId = Auth::user()->shop_id;

        // Current Month Data
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        // Last Month Data for comparison
        $startOfLastMonth = Carbon::now()->subMonth()->startOfMonth();
        $endOfLastMonth = Carbon::now()->subMonth()->endOfMonth();

        // 1. Revenue
        $currentMonthRevenue = Sale::where('shop_id', $shopId)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$startOfMonth, $endOfMonth])
            ->sum('total');

        $lastMonthRevenue = Sale::where('shop_id', $shopId)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('total');

        $revenueGrowth = 0;
        if ($lastMonthRevenue > 0) {
            $revenueGrowth = (($currentMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100;
        } elseif ($currentMonthRevenue > 0) {
            $revenueGrowth = 100; // 100% growth if last month was 0 but this month has sales
        }

        // 2. Sales Count (this month)
        $monthlySalesCount = Sale::where('shop_id', $shopId)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$startOfMonth, $endOfMonth])
            ->count();

        // 3. Products Stats
        $activeProductsCount = Product::where('shop_id', $shopId)
            ->where('is_active', true)
            ->count();

        // Define low stock threshold (e.g., total stock across active batches < 10)
        // Here we rely on the total_stock appended attribute logic, or we can query DB
        // For performance, query product_batches where aggregated quantity < low stock.
        // Assuming 'low_stock_threshold' exists on products, or hardcode typical e.g., 20
        $lowStockProductsCount = Product::where('shop_id', $shopId)
            ->where('is_active', true)
            ->whereHas('activeBatches', function ($q) {
                // To do a sum in whereHas is complex, alternatively fetch products and filter
            })->get()
            ->filter(function ($p) {
                // Use the appended 'total_stock' attribute
                return $p->total_stock > 0 && $p->total_stock <= ($p->reorder_level ?? 20);
            })->count();

        // If no reorder level is reliable, fallback to generic <= 10
        if ($lowStockProductsCount === 0) {
            $lowStockProductsCount = Product::where('shop_id', $shopId)
                ->where('is_active', true)
                ->get()
                ->filter(function ($p) {
                    return $p->total_stock < 10;
                })->count();
        }

        return response()->json([
            'revenue' => [
                'current' => $currentMonthRevenue,
                'growth' => round($revenueGrowth, 1)
            ],
            'sales_count' => $monthlySalesCount,
            'products' => [
                'active' => $activeProductsCount,
                'low_stock' => $lowStockProductsCount
            ]
        ]);
    }
}
