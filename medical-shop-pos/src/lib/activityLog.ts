import api from './api';

export interface ApiActivityLog {
    id: string;
    shop_id: string;
    user_type: string;
    user_id: string | null;
    action: string;
    module: string;
    description: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

export interface ActivityLogResponse {
    data: ApiActivityLog[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const activityLogApi = {
    list: async (params?: any): Promise<ActivityLogResponse> => {
        const r = await api.get('/activity-logs', { params });
        return r.data;
    },
};
