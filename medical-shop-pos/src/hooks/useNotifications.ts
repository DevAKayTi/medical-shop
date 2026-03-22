import { useEffect, useRef, useState, useCallback } from 'react';
import { getEcho } from '@/lib/echo';
import { notificationsLib, AppNotification } from '@/lib/notifications';
import { storageLib } from '@/lib/storage';

const POLL_INTERVAL_MS = 15_000; // poll every 15 seconds as fallback

export function useNotifications() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const wsConnectedRef = useRef(false);

    const loadNotifications = useCallback(async () => {
        try {
            const [all, count] = await Promise.all([
                notificationsLib.fetchAll(),
                notificationsLib.fetchUnreadCount(),
            ]);
            setNotifications(all);
            setUnreadCount(count);
        } catch {
            // silently fail — non-critical feature
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const shop = storageLib.getShop();
        const shopId = shop?.id;
        if (!shopId) {
            setLoading(false);
            return;
        }

        // Load on mount
        loadNotifications();

        // Try WebSocket (Reverb)
        try {
            const echo = getEcho();
            const channel = echo.private(`shop.${shopId}`);

            channel
                .listen('.notification', (event: AppNotification) => {
                    wsConnectedRef.current = true;
                    setNotifications((prev) => [event, ...prev]);
                    setUnreadCount((c) => c + 1);
                })
                .subscribed(() => {
                    wsConnectedRef.current = true;
                })
                .error(() => {
                    wsConnectedRef.current = false;
                });
        } catch (err) {
            console.warn('[Notifications] WebSocket unavailable, using polling fallback:', err);
        }

        // Polling fallback — always runs so new notifications appear even without Reverb
        pollTimerRef.current = setInterval(() => {
            loadNotifications();
        }, POLL_INTERVAL_MS);

        return () => {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            try {
                getEcho().leave(`shop.${shopId}`);
            } catch { /* ignore */ }
        };
    }, [loadNotifications]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await notificationsLib.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch { /* ignore */ }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationsLib.markAllAsRead();
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch { /* ignore */ }
    }, []);

    return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
