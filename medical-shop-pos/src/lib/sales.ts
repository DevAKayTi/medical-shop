import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiCustomer {
    id: string;
    shop_id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    date_of_birth?: string | null;
    gender?: "male" | "female" | "other" | null;
    address?: string | null;
    loyalty_points: number;
    total_spent: number | string;
    sales_count?: number;
    created_at: string;
    updated_at: string;
}

export type CreateCustomerPayload = Omit<ApiCustomer, "id" | "shop_id" | "loyalty_points" | "total_spent" | "sales_count" | "created_at" | "updated_at">;

export interface ApiSaleItem {
    id?: string;
    product_id: string;
    batch_id?: string | null;
    quantity: number;
    unit_price: number;
    discount?: number;
    tax?: number;
    total: number;
    product?: { id: string; name: string; generic_name?: string };
    batch?: { id: string; batch_number: string; expiry_date?: string };
}

export interface ApiSalePayment {
    method: "cash" | "card" | "bank_transfer" | "wallet" | "credit";
    amount: number;
    reference?: string | null;
}

export interface ApiSale {
    id: string;
    shop_id: string;
    invoice_number: string;
    customer_id?: string | null;
    cashier_id: string;
    subtotal: number | string;
    discount: number | string;
    tax: number | string;
    total: number | string;
    amount_paid: number | string;
    change_amount: number | string;
    status: "completed" | "refunded" | "partially_refunded";
    notes?: string | null;
    sold_at: string;
    created_at: string;
    customer?: ApiCustomer;
    cashier?: { id: string; name: string };
    register?: { id: string; name: string };
    items?: ApiSaleItem[];
    payments?: ApiSalePayment[];
}

export interface CreateSalePayload {
    customer_id?: string | null;
    session_id?: string | null;
    register_id?: string | null;
    subtotal: number;
    discount?: number;
    tax?: number;
    total: number;
    amount_paid: number;
    change_amount?: number;
    notes?: string | null;
    sold_at?: string;
    items: {
        product_id: string;
        batch_id?: string | null;
        quantity: number;
        unit_price: number;
        discount?: number;
        tax?: number;
        total: number;
    }[];
    payments: ApiSalePayment[];
}

// ─── Customer API ─────────────────────────────────────────────────────────────

export const customerApi = {
    list: async (params?: { search?: string }) => {
        const res = await api.get<{ data: ApiCustomer[]; total: number }>("/customers", { params });
        return res.data;
    },
    get: async (id: string) => {
        const res = await api.get<ApiCustomer>(`/customers/${id}`);
        return res.data;
    },
    create: async (payload: CreateCustomerPayload) => {
        const res = await api.post<ApiCustomer>("/customers", payload);
        return res.data;
    },
    update: async (id: string, payload: Partial<CreateCustomerPayload> & { loyalty_points?: number }) => {
        const res = await api.put<ApiCustomer>(`/customers/${id}`, payload);
        return res.data;
    },
    delete: async (id: string) => {
        await api.delete(`/customers/${id}`);
    },
};

// ─── Sale API ─────────────────────────────────────────────────────────────────

export const saleApi = {
    list: async (params?: { status?: string; customer_id?: string; date_from?: string; date_to?: string }) => {
        const res = await api.get<{ data: ApiSale[]; total: number; per_page: number }>("/sales", { params });
        return res.data;
    },
    get: async (id: string) => {
        const res = await api.get<ApiSale>(`/sales/${id}`);
        return res.data;
    },
    create: async (payload: CreateSalePayload) => {
        const res = await api.post<ApiSale>("/sales", payload);
        return res.data;
    },
    void: async (id: string) => {
        await api.delete(`/sales/${id}`);
    },
};
