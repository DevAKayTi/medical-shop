import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { storageLib } from './storage';

// Lazy singleton — only created when first accessed
let _echo: Echo | null = null;

export function getEcho(): Echo {
    if (_echo) return _echo;

    // Make Pusher available globally (required by laravel-echo)
    (window as typeof window & { Pusher: typeof Pusher }).Pusher = Pusher;

    _echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
        wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: 'http://localhost:8001/broadcasting/auth',
        auth: {
            headers: {
                Authorization: `Bearer ${storageLib.getAuthToken()}`,
                Accept: 'application/json',
            },
        },
    });

    return _echo;
}

// Call this on logout to disconnect cleanly
export function destroyEcho(): void {
    if (_echo) {
        _echo.disconnect();
        _echo = null;
    }
}
