import api from './api';

export interface ApiUser {
    id: string;
    name: string;
    email: string;
    phone?: string;
    is_active: boolean;
    roles: { id: string; name: string; slug: string }[];
}

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string; // role slug e.g. 'admin-user', 'cashier-user'
    phone?: string;
    is_active?: boolean;
}

const mapRoleLabel = (roles: { slug: string }[]): string => {
    if (!roles || roles.length === 0) return 'Cashier';
    if (roles.some(r => r.slug.includes('admin'))) return 'Admin';
    if (roles.some(r => r.slug.includes('manager'))) return 'Manager';
    return 'Cashier';
};

export const userApi = {
    list: async (): Promise<ApiUser[]> => {
        const res = await api.get('/users');
        return res.data;
    },

    create: async (payload: CreateUserPayload): Promise<ApiUser> => {
        const res = await api.post('/users', payload);
        return res.data;
    },

    update: async (id: string, payload: Partial<CreateUserPayload>): Promise<ApiUser> => {
        const res = await api.put(`/users/${id}`, payload);
        return res.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}`);
    },

    getRoleLabel: mapRoleLabel,
};
