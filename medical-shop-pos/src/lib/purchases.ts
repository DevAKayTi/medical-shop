import api from './api';
import { ApiSupplier, ApiProduct, ApiProductBatch } from './inventory';

// ─── Types ────────────────────────────────────────────────────────────

export interface ApiPurchaseItem {
    id?: string;
    product_id: string;
    batch_id?: string | null;
    quantity: number;
    purchase_price: number;
    mrp?: number | null;
    total: number;
    batch_number?: string | null;
    manufacture_date?: string | null;
    expiry_date?: string | null;
    product?: ApiProduct;
    batch?: ApiProductBatch;
}

export interface ApiPurchase {
    id: string;
    shop_id: string;
    supplier_id: string;
    purchase_number: string;
    status: 'pending' | 'received' | 'cancelled';
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    purchased_at: string | null;
    received_at: string | null;
    notes: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    supplier?: ApiSupplier;
    items?: ApiPurchaseItem[];
    createdBy?: { name: string };
}

export interface ApiPurchaseReturn {
    id: string;
    shop_id: string;
    purchase_id: string;
    return_number: string;
    status: 'pending' | 'completed' | 'cancelled';
    reason: string | null;
    total: number;
    created_at: string;
    items?: ApiPurchaseReturnItem[];
}

export interface ApiPurchaseReturnItem {
    id?: string;
    product_id: string;
    batch_id?: string | null;
    quantity: number;
    purchase_price: number;
    total: number;
    product?: ApiProduct;
}

export interface CreatePurchasePayload {
    supplier_id: string;
    purchase_number: string;
    status?: 'pending' | 'received';
    subtotal: number;
    discount?: number;
    tax?: number;
    total: number;
    purchased_at?: string | null;
    notes?: string | null;
    items: Omit<ApiPurchaseItem, 'id' | 'product' | 'batch'>[];
}

// ─── Purchase API ─────────────────────────────────────────────────────

export const purchaseApi = {
    list: async (params?: { status?: string; supplier_id?: string }) => {
        const res = await api.get<{ data: ApiPurchase[]; total: number; per_page: number }>('/purchases', { params });
        return res.data;
    },

    get: async (id: string) => {
        const res = await api.get<ApiPurchase>(`/purchases/${id}`);
        return res.data;
    },

    create: async (data: CreatePurchasePayload) => {
        const res = await api.post<ApiPurchase>('/purchases', data);
        return res.data;
    },

    update: async (id: string, data: Partial<ApiPurchase>) => {
        const res = await api.put<ApiPurchase>(`/purchases/${id}`, data);
        return res.data;
    },

    delete: async (id: string) => {
        await api.delete(`/purchases/${id}`);
    },

    markReceived: async (id: string) => {
        const res = await api.put<ApiPurchase>(`/purchases/${id}`, { status: 'received', received_at: new Date().toISOString().split('T')[0] });
        return res.data;
    },
};

// ─── Purchase Return API ───────────────────────────────────────────────

export const purchaseReturnApi = {
    list: async () => {
        const res = await api.get<{ data: ApiPurchaseReturn[] }>('/purchase-returns');
        return res.data.data;
    },

    create: async (data: { purchase_id: string; reason?: string; items: { product_id: string; batch_id?: string; quantity: number; purchase_price: number; total: number }[] }) => {
        const res = await api.post<ApiPurchaseReturn>('/purchase-returns', data);
        return res.data;
    },

    complete: async (id: string) => {
        const res = await api.post<ApiPurchaseReturn>(`/purchase-returns/${id}/complete`);
        return res.data;
    },
};
