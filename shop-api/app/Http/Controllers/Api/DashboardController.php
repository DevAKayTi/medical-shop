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

        // Daily Data
        $startOfDay = Carbon::now()->startOfDay();
        $endOfDay = Carbon::now()->endOfDay();
        $startOfYesterday = Carbon::now()->subDay()->startOfDay();
        $endOfYesterday = Carbon::now()->subDay()->endOfDay();

        // 1. Daily Revenue
        $dailyRevenue = Sale::where('shop_id', $shopId)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$startOfDay, $endOfDay])
            ->sum('total');

        $yesterdayRevenue = Sale::where('shop_id', $shopId)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$startOfYesterday, $endOfYesterday])
            ->sum('total');

        $dailyGrowth = 0;
        if ($yesterdayRevenue > 0) {
            $dailyGrowth = (($dailyRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100;
        } elseif ($dailyRevenue > 0) {
            $dailyGrowth = 100;
        }

        // 2. Monthly Revenue
        $monthlyRevenue = Sale::where('shop_id', $shopId)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$startOfMonth, $endOfMonth])
            ->sum('total');

        $lastMonthRevenue = Sale::where('shop_id', $shopId)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('total');

        $monthlyGrowth = 0;
        if ($lastMonthRevenue > 0) {
            $monthlyGrowth = (($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100;
        } elseif ($monthlyRevenue > 0) {
            $monthlyGrowth = 100;
        }

        // 3. Yearly Revenue
        $startOfYear = Carbon::now()->startOfYear();
        $endOfYear = Carbon::now()->endOfYear();
        $startOfLastYear = Carbon::now()->subYear()->startOfYear();
        $endOfLastYear = Carbon::now()->subYear()->endOfYear();

        $yearlyRevenue = Sale::where('shop_id', $shopId)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$startOfYear, $endOfYear])
            ->sum('total');

        $lastYearRevenue = Sale::where('shop_id', $shopId)
            ->where('status', 'completed')
            ->whereBetween('sold_at', [$startOfLastYear, $endOfLastYear])
            ->sum('total');

        $yearlyGrowth = 0;
        if ($lastYearRevenue > 0) {
            $yearlyGrowth = (($yearlyRevenue - $lastYearRevenue) / $lastYearRevenue) * 100;
        } elseif ($yearlyRevenue > 0) {
            $yearlyGrowth = 100;
        }

        // 4. Sales Count (this month)
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
                'daily' => [
                    'current' => $dailyRevenue,
                    'growth' => round($dailyGrowth, 1)
                ],
                'monthly' => [
                    'current' => $monthlyRevenue,
                    'growth' => round($monthlyGrowth, 1)
                ],
                'yearly' => [
                    'current' => $yearlyRevenue,
                    'growth' => round($yearlyGrowth, 1)
                ]
            ],
            'sales_count' => $monthlySalesCount,
            'products' => [
                'active' => $activeProductsCount,
                'low_stock' => $lowStockProductsCount
            ]
        ]);
    }

    /**
     * Get detailed revenue breakdown for the Revenue Details Page.
     */
    public function revenueDetails(Request $request)
    {
        $shopId = Auth::user()->shop_id;
        $view = $request->query('view', 'daily'); // 'daily' or 'monthly'

        if ($view === 'daily') {
            // Optional date param, defaults to today
            $dateParam = $request->query('date');
            $date = $dateParam ? Carbon::parse($dateParam) : Carbon::now();
            
            $startOfDay = $date->copy()->startOfDay();
            $endOfDay = $date->copy()->endOfDay();

            $salesQuery = Sale::where('shop_id', $shopId)
                ->whereIn('status', ['completed', 'returned'])
                ->whereBetween('sold_at', [$startOfDay, $endOfDay]);

            $grossSales = (clone $salesQuery)->where('total', '>', 0)->sum('total');
            $returns = (clone $salesQuery)->where('total', '<', 0)->sum('total'); // Will be negative
            $netRevenue = $grossSales + $returns;
            
            // Eager load items for journal/ledger view
            $sales = $salesQuery->with(['customer', 'cashier', 'items.product'])->orderBy('sold_at', 'desc')->get();

            return response()->json([
                'gross_sales' => $grossSales,
                'returns' => abs($returns),
                'net_revenue' => $netRevenue,
                'date' => $startOfDay->toDateString(),
                'sales' => $sales
            ]);
        } 
        
        if ($view === 'monthly') {
            // Optional month param (YYYY-MM), defaults to current month
            $monthParam = $request->query('month');
            $month = $monthParam ? Carbon::parse($monthParam . '-01') : Carbon::now();
            
            $startOfMonth = $month->copy()->startOfMonth();
            $endOfMonth = $month->copy()->endOfMonth();

            $grossSales = Sale::where('shop_id', $shopId)
                ->whereIn('status', ['completed', 'returned'])
                ->where('total', '>', 0)
                ->whereBetween('sold_at', [$startOfMonth, $endOfMonth])
                ->sum('total');
                
            $returns = Sale::where('shop_id', $shopId)
                ->whereIn('status', ['completed', 'returned'])
                ->where('total', '<', 0)
                ->whereBetween('sold_at', [$startOfMonth, $endOfMonth])
                ->sum('total');

            $netRevenue = $grossSales + $returns;

            // Day by day aggregation
            $dailyStats = Sale::select(
                DB::raw('DATE(sold_at) as date'),
                DB::raw('SUM(CASE WHEN total > 0 THEN total ELSE 0 END) as gross_sales'),
                DB::raw('SUM(CASE WHEN total < 0 THEN total ELSE 0 END) as returns'),
                DB::raw('SUM(total) as net_revenue')
            )
            ->where('shop_id', $shopId)
            ->whereIn('status', ['completed', 'returned'])
            ->whereBetween('sold_at', [$startOfMonth, $endOfMonth])
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

            return response()->json([
                'gross_sales' => $grossSales,
                'returns' => abs($returns),
                'net_revenue' => $netRevenue,
                'month' => $startOfMonth->format('Y-m'),
                'daily_breakdown' => $dailyStats
            ]);
        }

        return response()->json(['error' => 'Invalid view parameter'], 400);
    }
}
