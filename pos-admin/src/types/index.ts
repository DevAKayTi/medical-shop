export interface Permission {
    id: string;
    name: string;
    slug: string;
    module: string | null;
    guard: string;
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: string;
    name: string;
    slug: string;
    guard: string;
    description: string | null;
    permissions?: Permission[];
    users_count?: number;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    email_verified_at: string | null;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
    roles?: Role[];
}
