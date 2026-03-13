import { storageLib, User, Role } from "./storage";
import api from "./api";

// Helper to map backend roles to our frontend Role type
const mapRole = (roles: Array<{ name: string; slug: string }>): Role => {
    if (!roles || roles.length === 0) return "Cashier"; // Default fallback

    // Check for admin
    if (roles.some(r => r.slug === "admin-user" || r.slug.includes("admin"))) return "Admin";
    // Check for manager
    if (roles.some(r => r.slug === "manager-user" || r.slug.includes("manager"))) return "Manager";

    return "Cashier";
};

// Helper to flatten permissions from roles
const extractPermissions = (roles: Array<{ name: string; slug: string; permissions?: Array<{ slug: string }> }>): string[] => {
    if (!roles) return [];

    const permissions = new Set<string>();

    roles.forEach(role => {
        if (role.permissions && Array.isArray(role.permissions)) {
            role.permissions.forEach(p => {
                if (p.slug) permissions.add(p.slug);
            });
        }
    });

    return Array.from(permissions);
};

export const authLib = {
    login: async (email: string, passwordPlain: string): Promise<User | null> => {
        try {
            const response = await api.post('/login', {
                email,
                password: passwordPlain
            });

            if (response.data && response.data.token && response.data.user) {
                const token = response.data.token;
                const backendUser = response.data.user;

                storageLib.setAuthToken(token);

                const user: User = {
                    id: backendUser.id,
                    name: backendUser.name,
                    email: backendUser.email,
                    roles: backendUser.roles || [],
                    role: mapRole(backendUser.roles || []),
                    permissions: extractPermissions(backendUser.roles || [])
                };

                storageLib.setAuthUser(user);
                return user;
            }
        } catch (error) {
            console.error("Login failed:", error);
            // In a real app we might throw the error to show specific messages
        }
        return null;
    },

    me: async (): Promise<User | null> => {
        try {
            const response = await api.get('/me');
            if (response.data) {
                const backendUser = response.data;
                const user: User = {
                    id: backendUser.id,
                    name: backendUser.name,
                    email: backendUser.email,
                    roles: backendUser.roles || [],
                    role: mapRole(backendUser.roles || []),
                    permissions: extractPermissions(backendUser.roles || [])
                };
                storageLib.setAuthUser(user);
                return user;
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            storageLib.logout();
        }
        return null;
    },

    logout: async (): Promise<void> => {
        try {
            const token = storageLib.getAuthToken();
            if (token) {
                await api.post('/logout');
            }
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            storageLib.logout();
        }
    },

    isAdmin: (user?: User | null): boolean => {
        const u = user || storageLib.getAuthUser();
        return u?.role === "Admin";
    },

    isManagerOrAdmin: (user?: User | null): boolean => {
        const u = user || storageLib.getAuthUser();
        return u?.role === "Admin" || u?.role === "Manager";
    },

    isCashierOrAdmin: (user?: User | null): boolean => {
        const u = user || storageLib.getAuthUser();
        return u?.role === "Admin" || u?.role === "Cashier";
    },

    // New fine-grained permission check based on the RBAC enterprise guide
    hasPermission: (slug: string, user?: User | null): boolean => {
        const u = user || storageLib.getAuthUser();
        if (!u || !u.permissions) return false;

        return u.permissions.includes(slug);
    }
};
