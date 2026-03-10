import api from './api';

// ─── Types ───────────────────────────────────────────────────────────

export interface ApiCategory {
    id: string;
    shop_id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    is_active: boolean;
}

export interface ApiSupplier {
    id: string;
    shop_id: string;
    name: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    is_active: boolean;
}

export interface ApiProduct {
    id: string;
    shop_id: string;
    category_id: string | null;
    name: string;
    generic_name: string | null;
    barcode: string | null;
    sku: string | null;
    medicine_type: string | null;
    manufacturer: string | null;
    unit: string | null;
    mrp: number;
    purchase_price: number | null;
    tax_rate: number;
    is_controlled_drug: boolean;
    prescription_required: boolean;
    description: string | null;
    is_active: boolean;
    category?: ApiCategory;
    batches?: ApiProductBatch[];
}

export interface ApiProductBatch {
    id: string;
    shop_id: string;
    product_id: string;
    batch_number: string;
    manufacture_date: string | null;
    expiry_date: string;
    quantity: number;
    purchase_price: number | null;
    selling_price: number;
    mrp: number | null;
    is_active: boolean;
    supplier_id?: string | null;
    supplier?: ApiSupplier;
}

export interface ApiStockAdjustment {
    id: string;
    shop_id: string;
    product_id: string;
    batch_id: string | null;
    type: "increase" | "decrease" | "write_off" | "correction";
    quantity: number;
    reason: string | null;
    adjusted_by: string;
    product?: ApiProduct;
    batch?: ApiProductBatch;
    user?: { name: string };
    created_at: string;
}

export interface ApiInventoryLedger {
    id: string;
    shop_id: string;
    product_id: string;
    batch_id: string | null;
    type: "credit" | "debit";
    quantity: number;
    reference_type: "purchase" | "sale" | "adjustment" | "return" | "transfer";
    reference_id: string | null;
    balance_after: number;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    product?: ApiProduct;
    batch?: ApiProductBatch;
    creator?: { name: string };
}

// ─── Category API ─────────────────────────────────────────────────────

export const categoryApi = {
    list: async (): Promise<ApiCategory[]> => {
        const r = await api.get('/categories');
        return r.data;
    },
    create: async (data: Partial<ApiCategory>): Promise<ApiCategory> => {
        const r = await api.post('/categories', data);
        return r.data;
    },
    update: async (id: string, data: Partial<ApiCategory>): Promise<ApiCategory> => {
        const r = await api.put(`/categories/${id}`, data);
        return r.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/categories/${id}`);
    },
};

// ─── Supplier API ─────────────────────────────────────────────────────

export const supplierApi = {
    list: async (): Promise<ApiSupplier[]> => {
        const r = await api.get('/suppliers');
        return r.data;
    },
    create: async (data: Partial<ApiSupplier>): Promise<ApiSupplier> => {
        const r = await api.post('/suppliers', data);
        return r.data;
    },
    update: async (id: string, data: Partial<ApiSupplier>): Promise<ApiSupplier> => {
        const r = await api.put(`/suppliers/${id}`, data);
        return r.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/suppliers/${id}`);
    },
};

// ─── Product API ──────────────────────────────────────────────────────

export const productApi = {
    list: async (): Promise<ApiProduct[]> => {
        const r = await api.get('/products');
        return r.data;
    },
    create: async (data: Partial<ApiProduct>): Promise<ApiProduct> => {
        const r = await api.post('/products', data);
        return r.data;
    },
    update: async (id: string, data: Partial<ApiProduct>): Promise<ApiProduct> => {
        const r = await api.put(`/products/${id}`, data);
        return r.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/products/${id}`);
    },
    batches: async (productId: string): Promise<ApiProductBatch[]> => {
        const r = await api.get(`/products/${productId}/batches`);
        return r.data;
    },
    addBatch: async (productId: string, data: any) => {
        const res = await api.post<ApiProductBatch>(`/products/${productId}/batches`, data);
        return res.data;
    },
    updateBatch: async (batchId: string, data: any) => {
        const res = await api.put<ApiProductBatch>(`/batches/${batchId}`, data);
        return res.data;
    },
    deleteBatch: async (batchId: string) => {
        await api.delete(`/batches/${batchId}`);
    },
};

export const adjustmentApi = {
    list: async () => {
        const res = await api.get<{ data: ApiStockAdjustment[] }>("/stock-adjustments");
        return res.data.data;
    },
    create: async (data: Partial<ApiStockAdjustment>) => {
        const res = await api.post<ApiStockAdjustment>("/stock-adjustments", data);
        return res.data;
    },
};

export const ledgerApi = {
    list: async () => {
        const res = await api.get<{ data: ApiInventoryLedger[] }>("/inventory-ledgers");
        return res.data.data;
    },
};
