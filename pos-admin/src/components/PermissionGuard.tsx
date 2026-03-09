import { Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

/**
 * Helper component to navigate back one step in history
 */
function RedirectBack() {
    const navigate = useNavigate();
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate(-1);
        }, 0);
        return () => clearTimeout(timer);
    }, [navigate]);
    return null;
}

interface PermissionGuardProps {
    children: React.ReactNode;
    permissions: string | string[];
    mode?: "any" | "all";
    fallback?: React.ReactNode | null;
    redirectToPrevious?: boolean;
}

/**
 * Guard component that only renders its children if the user has the required permission(s).
 * If permission is denied, it returns the fallback (defaulting to null) or redirects back.
 */
export function PermissionGuard({
    children,
    permissions,
    mode = "any",
    fallback = null,
    redirectToPrevious = false
}: PermissionGuardProps) {
    const { hasPermission, loading } = useAuth();

    if (loading) return null;

    if (!hasPermission(permissions, mode)) {
        if (redirectToPrevious) return <RedirectBack />;
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
