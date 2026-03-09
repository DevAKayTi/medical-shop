const BASE_URL = 'http://localhost:8000/api';

export async function apiClient(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('pos_access_token');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        localStorage.removeItem('pos_access_token');
        localStorage.removeItem('pos_user');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
            status: response.status,
            message: errorData.message || 'Something went wrong',
            errors: errorData.errors || {}
        };
    }

    return response.status === 204 ? null : response.json();
}
