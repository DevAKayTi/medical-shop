import { useState, useRef, useEffect } from 'react';
import { Bell, BellRing, Check, CheckCheck, ShoppingCart, Package, AlertTriangle, UserPlus, Info } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { AppNotification } from '@/lib/notifications';

function getNotificationIcon(type: AppNotification['type']) {
    switch (type) {
        case 'sale': return <ShoppingCart className="h-4 w-4 text-green-400" />;
        case 'purchase': return <Package className="h-4 w-4 text-blue-400" />;
        case 'low_stock': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
        case 'user': return <UserPlus className="h-4 w-4 text-purple-400" />;
        default: return <Info className="h-4 w-4 text-slate-400" />;
    }
}

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Notifications"
            >
                {unreadCount > 0
                    ? <BellRing className="h-5 w-5 animate-[wiggle_0.5s_ease-in-out]" />
                    : <Bell className="h-5 w-5" />
                }
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/40 dark:text-red-400">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <div className="py-8 text-center text-sm text-slate-400">Loading…</div>
                        ) : notifications.length === 0 ? (
                            <div className="py-8 text-center">
                                <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                <p className="text-sm text-slate-400">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`flex gap-3 px-4 py-3 transition-colors ${n.read_at
                                            ? 'bg-white dark:bg-slate-900'
                                            : 'bg-blue-50 dark:bg-blue-950/30'
                                        }`}
                                >
                                    {/* Icon */}
                                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                        {getNotificationIcon(n.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight">
                                            {n.title}
                                        </p>
                                        {n.message && (
                                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                {n.message}
                                            </p>
                                        )}
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            {timeAgo(n.created_at)}
                                        </p>
                                    </div>

                                    {/* Mark as read */}
                                    {!n.read_at && (
                                        <button
                                            onClick={() => markAsRead(n.id)}
                                            title="Mark as read"
                                            className="mt-0.5 flex-shrink-0 rounded p-1 text-slate-300 hover:text-blue-500 transition-colors"
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
