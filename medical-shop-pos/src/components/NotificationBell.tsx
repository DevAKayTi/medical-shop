import { useState, useEffect } from 'react';
import { Bell, BellRing, Check, CheckCheck, ShoppingCart, Package, AlertTriangle, UserPlus, Info, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { AppNotification } from '@/lib/notifications';

function getNotificationIcon(type: AppNotification['type']) {
    switch (type) {
        case 'sale': return <ShoppingCart className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />;
        case 'purchase': return <Package className="h-5 w-5 text-blue-600 dark:text-blue-500" />;
        case 'low_stock': return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />;
        case 'user': return <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-500" />;
        default: return <Info className="h-5 w-5 text-slate-500 dark:text-slate-400" />;
    }
}

function getIconBg(type: AppNotification['type']) {
    switch (type) {
        case 'sale': return "bg-emerald-100 dark:bg-emerald-500/20";
        case 'purchase': return "bg-blue-100 dark:bg-blue-500/20";
        case 'low_stock': return "bg-amber-100 dark:bg-amber-500/20";
        case 'user': return "bg-indigo-100 dark:bg-indigo-500/20";
        default: return "bg-slate-100 dark:bg-slate-800";
    }
}

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `Just now`;
    if (diff < 3600) {
        const m = Math.floor(diff / 60);
        return `${m} minute${m !== 1 ? 's' : ''} ago`;
    }
    if (diff < 86400) {
        const h = Math.floor(diff / 3600);
        return `${h} hour${h !== 1 ? 's' : ''} ago`;
    }
    const d = Math.floor(diff / 86400);
    return `${d} day${d !== 1 ? 's' : ''} ago`;
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    // Handle escape key to close sidebar
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) setOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    return (
        <>
            {/* Bell Button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className={`relative flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${open || unreadCount > 0
                        ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                aria-label="Notifications"
            >
                {unreadCount > 0
                    ? <BellRing className="h-[22px] w-[22px] animate-[wiggle_0.5s_ease-in-out]" />
                    : <Bell className="h-[22px] w-[22px]" />
                }
                {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[11px] font-bold text-white shadow-sm dark:border-slate-950">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Sidebar Overlay (Backdrop) */}
            {open && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 dark:bg-slate-950/80"
                    onClick={() => setOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Sliding Panel */}
            <div
                className={`fixed right-0 top-0 bottom-0 z-[110] flex w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-950 sm:w-[420px] ${open ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Sidebar Header */}
                <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-6 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Notifications</h2>
                        {unreadCount > 0 && (
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                                You have {unreadCount} new message{unreadCount !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="group flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                                title="Mark all as read"
                            >
                                <CheckCheck className="mr-2 h-4 w-4" />
                                Mark all read
                            </button>
                        )}
                        <button
                            onClick={() => setOpen(false)}
                            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                            aria-label="Close notifications"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Sidebar List */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 pb-20 dark:bg-slate-950 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    {loading ? (
                        <div className="py-24 flex justify-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-800 dark:border-t-blue-500" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-center px-6">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 mb-5 border border-slate-200 dark:border-slate-800">
                                <Bell className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">You're all caught up!</p>
                            <p className="text-base text-slate-500 dark:text-slate-400 mt-2 max-w-xs">There are no new notifications or alerts right now.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`relative flex flex-col rounded-xl border p-5 transition-shadow hover:shadow-md ${n.read_at
                                            ? 'border-slate-200 bg-white opacity-90 dark:border-slate-800 dark:bg-slate-900'
                                            : 'border-blue-200 bg-blue-50/80 shadow-sm dark:border-blue-900/50 dark:bg-blue-900/20'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-white/50 shadow-sm dark:border-slate-800/50 ${getIconBg(n.type)}`}>
                                            {getNotificationIcon(n.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`text-base tracking-tight ${n.read_at ? 'font-semibold text-slate-800 dark:text-slate-200' : 'font-bold text-slate-900 dark:text-white'}`}>
                                                        {n.title}
                                                    </h3>
                                                    {/* Explicit "New" Badge for unread items instead of a dot */}
                                                    {!n.read_at && (
                                                        <span className="inline-flex items-center rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                                                            New
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {n.message && (
                                                <p className={`text-sm leading-relaxed ${n.read_at ? 'text-slate-600 dark:text-slate-400' : 'text-slate-700 font-medium dark:text-slate-300'}`}>
                                                    {n.message}
                                                </p>
                                            )}

                                            <div className="mt-4 flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                                    {timeAgo(n.created_at)}
                                                </span>

                                                {/* Mark as read button - very clear and legible */}
                                                {!n.read_at && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                                        className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:text-blue-800 dark:bg-slate-800 dark:text-blue-400 dark:ring-slate-700 dark:hover:bg-slate-700 dark:hover:text-blue-300 transition-all active:scale-95"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
