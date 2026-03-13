<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class DashboardController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:view-dashboard', only: ['stats']),
            new Middleware('can:view-reports', only: ['revenueDetails', 'reports']),
        ];
    }
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

    /**
     * Analytics reports for the Reports & Analytics frontend page.
     * ?type=top_products|payment_methods|cashier_performance|date_range_summary
     * ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
     */
    public function reports(Request $request)
    {
        $shopId = Auth::user()->shop_id;
        $type    = $request->query('type', 'date_range_summary');

        // Parse date range — default to current month
        $from = $request->filled('date_from')
            ? Carbon::parse($request->query('date_from'))->startOfDay()
            : Carbon::now()->startOfMonth()->startOfDay();

        $to = $request->filled('date_to')
            ? Carbon::parse($request->query('date_to'))->endOfDay()
            : Carbon::now()->endOfDay();

        // ── 1. Date-Range Summary ────────────────────────────────────────
        if ($type === 'date_range_summary') {
            $base = Sale::where('shop_id', $shopId)
                ->whereIn('status', ['completed', 'returned'])
                ->whereBetween('sold_at', [$from, $to]);

            $grossSales  = (clone $base)->where('total', '>', 0)->sum('total');
            $returnsAmt  = (clone $base)->where('total', '<', 0)->sum('total');
            $txCount     = (clone $base)->where('total', '>', 0)->count();
            $netRevenue  = $grossSales + $returnsAmt;
            $avgOrder    = $txCount > 0 ? $grossSales / $txCount : 0;

            // Breakdown by day
            $dailyBreakdown = Sale::select(
                    DB::raw('DATE(sold_at) as date'),
                    DB::raw('SUM(CASE WHEN total > 0 THEN total ELSE 0 END) as gross_sales'),
                    DB::raw('SUM(CASE WHEN total < 0 THEN total ELSE 0 END) as returns'),
                    DB::raw('SUM(CASE WHEN total > 0 THEN 1 ELSE 0 END) as transactions'),
                    DB::raw('SUM(total) as net_revenue')
                )
                ->where('shop_id', $shopId)
                ->whereIn('status', ['completed', 'returned'])
                ->whereBetween('sold_at', [$from, $to])
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            return response()->json([
                'gross_sales'     => $grossSales,
                'returns'         => abs($returnsAmt),
                'net_revenue'     => $netRevenue,
                'transaction_count' => $txCount,
                'avg_order_value' => round($avgOrder, 2),
                'daily_breakdown' => $dailyBreakdown,
            ]);
        }

        // ── 2. Top Products ──────────────────────────────────────────────
        if ($type === 'top_products') {
            $topProducts = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->where('sales.shop_id', $shopId)
                ->where('sales.status', 'completed')
                ->whereBetween('sales.sold_at', [$from, $to])
                ->where('sale_items.quantity', '>', 0)  // exclude refund items
                ->select(
                    'products.id',
                    'products.name',
                    DB::raw('SUM(sale_items.quantity) as total_qty_sold'),
                    DB::raw('SUM(sale_items.total) as total_revenue'),
                    DB::raw('COUNT(DISTINCT sales.id) as order_count')
                )
                ->groupBy('products.id', 'products.name')
                ->orderByDesc('total_revenue')
                ->limit(20)
                ->get();

            return response()->json(['products' => $topProducts]);
        }

        // ── 3. Payment Methods ───────────────────────────────────────────
        if ($type === 'payment_methods') {
            $methods = DB::table('sale_payments')
                ->join('sales', 'sale_payments.sale_id', '=', 'sales.id')
                ->where('sales.shop_id', $shopId)
                ->where('sales.status', 'completed')
                ->whereBetween('sales.sold_at', [$from, $to])
                ->select(
                    'sale_payments.method',
                    DB::raw('SUM(sale_payments.amount) as total_amount'),
                    DB::raw('COUNT(DISTINCT sales.id) as transaction_count')
                )
                ->groupBy('sale_payments.method')
                ->orderByDesc('total_amount')
                ->get();

            return response()->json(['methods' => $methods]);
        }

        // ── 4. Cashier Performance ────────────────────────────────────────
        if ($type === 'cashier_performance') {
            $cashiers = DB::table('sales')
                ->join('users', 'sales.cashier_id', '=', 'users.id')
                ->where('sales.shop_id', $shopId)
                ->where('sales.status', 'completed')
                ->whereBetween('sales.sold_at', [$from, $to])
                ->select(
                    'users.id',
                    'users.name',
                    DB::raw('COUNT(sales.id) as sales_count'),
                    DB::raw('SUM(sales.total) as total_revenue'),
                    DB::raw('AVG(sales.total) as avg_sale_value')
                )
                ->groupBy('users.id', 'users.name')
                ->orderByDesc('total_revenue')
                ->get();

            return response()->json(['cashiers' => $cashiers]);
        }

        // ── 5. Product Profit Tracking ────────────────────────────────────
        if ($type === 'product_profit') {
            $rows = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->leftJoin('product_batches', 'sale_items.batch_id', '=', 'product_batches.id')
                ->where('sales.shop_id', $shopId)
                ->where('sales.status', 'completed')
                ->whereBetween('sales.sold_at', [$from, $to])
                ->where('sale_items.quantity', '>', 0)  // exclude refund lines
                ->select(
                    'products.id',
                    'products.name',
                    DB::raw('SUM(sale_items.quantity) as total_qty_sold'),
                    DB::raw('SUM(sale_items.unit_price * sale_items.quantity) as total_revenue'),
                    DB::raw('SUM(COALESCE(product_batches.purchase_price, 0) * sale_items.quantity) as total_cost'),
                    DB::raw('SUM(
                        (sale_items.unit_price - COALESCE(product_batches.purchase_price, 0))
                        * sale_items.quantity
                    ) as gross_profit'),
                    DB::raw('COUNT(DISTINCT sales.id) as order_count'),
                    DB::raw('MAX(COALESCE(product_batches.purchase_price, 0)) as unit_cost_latest'),
                    DB::raw('SUM(CASE WHEN product_batches.purchase_price IS NULL THEN 1 ELSE 0 END) as missing_cost_count')
                )
                ->groupBy('products.id', 'products.name')
                ->orderByDesc('gross_profit')
                ->get()
                ->map(function ($row) {
                    $rev = (float) $row->total_revenue;
                    $profit = (float) $row->gross_profit;
                    $row->margin_pct = $rev > 0 ? round(($profit / $rev) * 100, 2) : 0;
                    $row->total_revenue  = round($rev, 2);
                    $row->total_cost     = round((float) $row->total_cost, 2);
                    $row->gross_profit   = round($profit, 2);
                    $row->has_cost_data  = $row->missing_cost_count == 0;
                    return $row;
                });

            $summary = [
                'total_revenue'  => round($rows->sum('total_revenue'), 2),
                'total_cost'     => round($rows->sum('total_cost'), 2),
                'total_profit'   => round($rows->sum('gross_profit'), 2),
                'overall_margin' => $rows->sum('total_revenue') > 0
                    ? round(($rows->sum('gross_profit') / $rows->sum('total_revenue')) * 100, 2)
                    : 0,
            ];

            return response()->json(['products' => $rows, 'summary' => $summary]);
        }

        return response()->json(['error' => 'Invalid type parameter'], 400);
    }
}
