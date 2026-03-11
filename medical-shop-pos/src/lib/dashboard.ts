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
    }
};
