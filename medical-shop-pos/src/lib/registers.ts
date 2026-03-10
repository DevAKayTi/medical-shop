import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiCashRegister {
    id: string;
    shop_id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type CreateCashRegisterPayload = {
    name: string;
    is_active?: boolean;
};

export interface ApiShiftSession {
    id: string;
    shop_id: string;
    register_id: string;
    user_id: string;
    opening_cash: number | string;
    closing_cash: number | string | null;
    total_sales: number | string;
    total_refunds: number | string;
    opened_at: string;
    closed_at: string | null;
    status: "open" | "closed";
    notes: string | null;
    created_at: string;
    updated_at: string;

    // Included relations
    register?: ApiCashRegister;
    user?: {
        id: string;
        name: string;
        email: string;
    };
}

export type OpenShiftPayload = {
    register_id: string;
    opening_cash?: number;
    notes?: string;
};

export type CloseShiftPayload = {
    closing_cash: number;
    notes?: string;
};

// ─── Cash Register API ────────────────────────────────────────────────────────

export const registerApi = {
    list: async (params?: { is_active?: boolean }) => {
        const res = await api.get<ApiCashRegister[]>("/cash-registers", { params });
        return res.data;
    },
    get: async (id: string) => {
        const res = await api.get<ApiCashRegister>(`/cash-registers/${id}`);
        return res.data;
    },
    create: async (payload: CreateCashRegisterPayload) => {
        const res = await api.post<ApiCashRegister>("/cash-registers", payload);
        return res.data;
    },
    update: async (id: string, payload: Partial<CreateCashRegisterPayload>) => {
        const res = await api.put<ApiCashRegister>(`/cash-registers/${id}`, payload);
        return res.data;
    },
    delete: async (id: string) => {
        await api.delete(`/cash-registers/${id}`);
    },
};

// ─── Shift Session API ────────────────────────────────────────────────────────

export const shiftSessionApi = {
    list: async (params?: { status?: "open" | "closed"; user_id?: string; page?: number }) => {
        const res = await api.get<{ data: ApiShiftSession[]; total: number; current_page: number; last_page: number }>("/shift-sessions", { params });
        return res.data;
    },
    get: async (id: string) => {
        const res = await api.get<ApiShiftSession>(`/shift-sessions/${id}`);
        return res.data;
    },
    open: async (payload: OpenShiftPayload) => {
        const res = await api.post<ApiShiftSession>("/shift-sessions", payload);
        return res.data;
    },
    close: async (id: string, payload: CloseShiftPayload) => {
        const res = await api.post<ApiShiftSession>(`/shift-sessions/${id}/close`, payload);
        return res.data;
    },
    // Helper to get current user's active shift
    getCurrentActive: async () => {
        // Fetch open shifts and filter by the current user manually if the API doesn't support 'me'
        // Alternatively, the backend handles this if we pass the current user's ID
        // For simplicity, we just list with status=open and find the one belonging to the local user context
        // Or better yet, we can add a specific scope/parameter
        const res = await shiftSessionApi.list({ status: "open" });
        return res.data; // The caller will handle finding their specific session
    }
};
