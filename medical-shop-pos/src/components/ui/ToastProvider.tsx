import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    variant: ToastVariant;
}

interface ToastContextValue {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
    return ctx;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastVariant, {
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    border: string;
    text: string;
    bar: string;
}> = {
    success: {
        icon: CheckCircle2,
        bg: "bg-emerald-50 dark:bg-emerald-900/30",
        border: "border-emerald-200 dark:border-emerald-800",
        text: "text-emerald-800 dark:text-emerald-300",
        bar: "bg-emerald-500",
    },
    error: {
        icon: XCircle,
        bg: "bg-red-50 dark:bg-red-900/30",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-800 dark:text-red-300",
        bar: "bg-red-500",
    },
    info: {
        icon: Info,
        bg: "bg-blue-50 dark:bg-blue-900/30",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-800 dark:text-blue-300",
        bar: "bg-blue-500",
    },
    warning: {
        icon: AlertTriangle,
        bg: "bg-amber-50 dark:bg-amber-900/30",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-800 dark:text-amber-300",
        bar: "bg-amber-500",
    },
};

// ─── Toast Item ───────────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    const { icon: Icon, bg, border, text, bar } = TOAST_CONFIG[toast.variant];

    return (
        <div
            role="alert"
            aria-live="assertive"
            style={{ animation: "toast-slide-in 0.3s ease-out forwards" }}
            className={`relative flex items-start gap-3 w-80 rounded-lg border px-4 py-3 shadow-lg text-sm font-medium overflow-hidden ${bg} ${border} ${text}`}
        >
            {/* Progress bar */}
            <span
                className={`absolute bottom-0 left-0 h-[3px] ${bar}`}
                style={{ animation: "toast-shrink 3.5s linear forwards" }}
            />

            <Icon className="h-5 w-5 mt-0.5 shrink-0" />
            <span className="flex-1 leading-snug break-words">{toast.message}</span>
            <button
                onClick={() => onDismiss(toast.id)}
                className="ml-1 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss notification"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, variant: ToastVariant) => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { id, message, variant }]);

        // Auto-dismiss after 3.5s
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const ctx: ToastContextValue = {
        success: (msg) => addToast(msg, "success"),
        error: (msg) => addToast(msg, "error"),
        info: (msg) => addToast(msg, "info"),
        warning: (msg) => addToast(msg, "warning"),
    };

    return (
        <ToastContext.Provider value={ctx}>
            {children}
            {createPortal(
                <div
                    aria-label="Notifications"
                    className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
                >
                    {toasts.map(t => (
                        <div key={t.id} className="pointer-events-auto">
                            <ToastItem toast={t} onDismiss={dismiss} />
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}
