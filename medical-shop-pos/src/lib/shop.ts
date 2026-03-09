import api from './api';
import { storageLib, ShopInfo } from './storage';

export const shopLib = {
    /**
     * Fetch the shop belonging to the authenticated user from the backend.
     * Caches the result in localStorage.
     */
    fetchShop: async (): Promise<ShopInfo | null> => {
        try {
            const response = await api.get('/shop');
            if (response.data) {
                storageLib.setShop(response.data);
                return response.data;
            }
        } catch (error) {
            console.error('Failed to fetch shop info:', error);
        }
        return null;
    },

    /**
     * Get the shop from the localStorage cache.
     */
    getShop: (): ShopInfo | null => {
        return storageLib.getShop();
    },
};
