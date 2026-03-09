import api from "@/lib/api";

export interface DashboardStats {
    revenue: {
        current: number;
        growth: number;
    };
    sales_count: number;
    products: {
        active: number;
        low_stock: number;
    };
}

export const dashboardApi = {
    getStats: async (): Promise<DashboardStats> => {
        const res = await api.get<DashboardStats>("/dashboard/stats");
        return res.data;
    }
};
