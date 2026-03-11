import api from "@/lib/api";
import { ApiSale } from "@/lib/sales";

export interface DashboardStats {
    revenue: {
        daily: { current: number; growth: number; };
        monthly: { current: number; growth: number; };
        yearly: { current: number; growth: number; };
    };
    sales_count: number;
    products: {
        active: number;
        low_stock: number;
    };
}

export interface DailyRevenueDetails {
    gross_sales: number;
    returns: number;
    net_revenue: number;
    date: string;
    sales: ApiSale[];
}

// Ensure ApiSale incorporates eager loaded items 
// (assuming ApiSale matches the shape from src/lib/sales.ts, 
// we assume it already has an `items?: ApiSaleItem[]` property, but we can double check)

export interface MonthlyRevenueDetails {
    gross_sales: number;
    returns: number;
    net_revenue: number;
    month: string;
    daily_breakdown: {
        date: string;
        gross_sales: number;
        returns: number;
        net_revenue: number;
    }[];
}

export interface DateRangeSummary {
    gross_sales: number;
    returns: number;
    net_revenue: number;
    transaction_count: number;
    avg_order_value: number;
    daily_breakdown: {
        date: string;
        gross_sales: number;
        returns: number;
        net_revenue: number;
        transactions: number;
    }[];
}

export interface TopProduct {
    id: string;
    name: string;
    total_qty_sold: number;
    total_revenue: number;
    order_count: number;
}

export interface PaymentMethodStat {
    method: string;
    total_amount: number;
    transaction_count: number;
}

export interface CashierStat {
    id: string;
    name: string;
    sales_count: number;
    total_revenue: number;
    avg_sale_value: number;
}

export interface ProductProfitStat {
    id: string;
    name: string;
    total_qty_sold: number;
    total_revenue: number;
    total_cost: number;
    gross_profit: number;
    margin_pct: number;
    order_count: number;
    has_cost_data: boolean;
}

export interface ProductProfitSummary {
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    overall_margin: number;
}

export const dashboardApi = {
    getStats: async (): Promise<DashboardStats> => {
        const res = await api.get<DashboardStats>("/dashboard/stats");
        return res.data;
    },
    getRevenueDetails: async (view: 'daily' | 'monthly', param?: string): Promise<any> => {
        const query = new URLSearchParams({ view });
        if (param) {
            query.append(view === 'daily' ? 'date' : 'month', param);
        }
        const res = await api.get(`/dashboard/revenue-details?${query.toString()}`);
        return res.data;
    },
    getReports: async (params: {
        type: 'date_range_summary' | 'top_products' | 'payment_methods' | 'cashier_performance' | 'product_profit';
        date_from?: string;
        date_to?: string;
    }): Promise<any> => {
        const query = new URLSearchParams(params as any);
        const res = await api.get(`/dashboard/reports?${query.toString()}`);
        return res.data;
    }
};
