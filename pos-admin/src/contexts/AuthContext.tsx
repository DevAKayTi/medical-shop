import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

import type { User } from "@/types";

type PermissionCheckMode = "any" | "all";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    hasPermission: (permissions: string | string[], mode?: PermissionCheckMode) => boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    hasPermission: () => false,
    refreshUser: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(() => {
        const saved = localStorage.getItem("pos_user");
        try {
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(!user);

    const refreshUser = async () => {
        const token = localStorage.getItem("pos_access_token");
        if (!token) {
            setUser(null);
            localStorage.removeItem("pos_user");
            setLoading(false);
            return;
        }

        try {
            const userData = await apiClient("/me");
            setUser(userData);
            localStorage.setItem("pos_user", JSON.stringify(userData));
        } catch (error) {
            console.error("Failed to fetch user profiles", error);
            localStorage.removeItem("pos_access_token");
            localStorage.removeItem("pos_user");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const hasPermission = (permissions: string | string[], mode: PermissionCheckMode = "any"): boolean => {
        if (!user || !user.roles) return false;

        const permsToCheck = Array.isArray(permissions) ? permissions : [permissions];

        // Extract all permissions from all roles the user has
        const userPerms = user.roles.flatMap((role: any) =>
            (role.permissions || []).map((p: any) => p.slug || p.name.toLowerCase().replace(/ /g, '-'))
        );

        if (mode === "any") {
            return permsToCheck.some(p => userPerms.includes(p));
        } else {
            return permsToCheck.every(p => userPerms.includes(p));
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, hasPermission, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
