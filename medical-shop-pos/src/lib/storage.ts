// In-browser localStorage wrapper for POS Data Models

export type Role = "Admin" | "Manager" | "Cashier";

export interface ShopSettingInfo {
    id: string;
    currency: string;
    tax_rate: number;
    invoice_prefix: string;
    invoice_counter: number;
    low_stock_threshold: number;
    timezone: string;
    receipt_footer: string;
}

export interface ShopInfo {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string;
    country: string;
    city: string;
    slug: string;
    logo_url: string | null;
    status: string;
    settings: ShopSettingInfo | null;
}

export interface User {
    id: string; // The backend uses UUIDs
    name: string;
    email: string; // Backend uses email to login
    roles: Array<{ name: string; slug: string; permissions?: Array<{ slug: string }> }>; // Shop-api returns a roles array
    role: Role; // We'll keep this for the frontend mapping (Admin | Manager | Cashier)
    permissions: string[]; // Flat array of permission slugs
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    batchNumber: string;
    cost: number;
    price: number;
    quantity: number;
    expiryDate: string; // ISO string
    unit: string;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    address: string;
    loyaltyPoints: number;
}

export interface SaleItem {
    productId: string;
    quantity: number;
    price: number;
    discount: number;
}

export interface Prescription {
    id: string;
    customerId: string;
    medicines: string[];
    date: string;
}

export interface Sale {
    id: string;
    items: SaleItem[];
    total: number;
    tax: number;
    customerId?: string;
    prescriptionId?: string;
    timestamp: string;
    cashierId: string;
}

export interface ShopSettings {
    shopName: string;
    taxRate: number;
    currencySymbol: string;
}

// Removing DEFAULT_USERS as we now use real auth

const DEFAULT_SETTINGS: ShopSettings = {
    shopName: "Medical Shop POS",
    taxRate: 5.0, // 5%
    currencySymbol: "MMK",
};

export const storageLib = {
    // Initialization
    init: () => {
        if (!localStorage.getItem("shop_settings")) {
            localStorage.setItem("shop_settings", JSON.stringify(DEFAULT_SETTINGS));
        }
        // Initialize empty arrays if they don't exist
        ["products", "sales", "customers", "prescriptions"].forEach(key => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify([]));
            }
        });
    },

    // Generic Get/Set
    getItem: <T>(key: string): T | null => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    setItem: <T>(key: string, value: T): void => {
        localStorage.setItem(key, JSON.stringify(value));
    },

    // Auth State
    setAuthUser: (user: User) => {
        localStorage.setItem("auth_user", JSON.stringify(user));
    },

    getAuthUser: (): User | null => {
        const data = localStorage.getItem("auth_user");
        return data ? JSON.parse(data) : null;
    },

    setAuthToken: (token: string) => {
        localStorage.setItem("auth_token", token);
    },

    getAuthToken: (): string | null => {
        return localStorage.getItem("auth_token");
    },

    setShop: (shop: import('./storage').ShopInfo) => {
        localStorage.setItem("shop_info", JSON.stringify(shop));
    },

    getShop: (): import('./storage').ShopInfo | null => {
        const data = localStorage.getItem("shop_info");
        return data ? JSON.parse(data) : null;
    },

    logout: () => {
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("shop_info");
    }
};
