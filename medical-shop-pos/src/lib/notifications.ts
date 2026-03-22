import api from './api';

export interface AppNotification {
    id: string;
    type: 'sale' | 'purchase' | 'low_stock' | 'user' | 'system';
    title: string;
    message: string | null;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
}

export const notificationsLib = {
    async fetchAll(): Promise<AppNotification[]> {
        const res = await api.get('/notifications');
        return res.data;
    },

    async fetchUnreadCount(): Promise<number> {
        const res = await api.get('/notifications/unread-count');
        return res.data.count;
    },

    async markAsRead(id: string): Promise<AppNotification> {
        const res = await api.post(`/notifications/${id}/read`);
        return res.data;
    },

    async markAllAsRead(): Promise<void> {
        await api.post('/notifications/read-all');
    },
};
