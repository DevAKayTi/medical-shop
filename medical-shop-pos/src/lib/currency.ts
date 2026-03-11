import { storageLib } from './storage';

/**
 * Get the current currency symbol from the cached shop info.
 * Falls back to local ShopSettings, then defaults to 'MMK'.
 */
export function getCurrencySymbol(): string {
    // Priority 1: backend shop settings (currency field from ShopSettingInfo)
    const shop = storageLib.getShop();
    if (shop?.settings?.currency) return shop.settings.currency;

    // Priority 2: local shop settings
    const local = storageLib.getItem<{ currencySymbol: string }>('shop_settings');
    if (local?.currencySymbol) return local.currencySymbol;

    return 'MMK';
}

/**
 * Format a number string with commas and decimals, without currency symbol.
 * e.g. formatNumber(12500) => "12,500"
 */
export function formatNumber(amount: number | string | null | undefined): string {
    const num = Number(amount ?? 0);
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/**
 * Format a number as a currency string using the current shop currency symbol.
 * e.g.  formatCurrency(12500) => "MMK 12,500"
 */
export function formatCurrency(amount: number | string | null | undefined): string {
    const sym = getCurrencySymbol();
    return `${sym} ${formatNumber(amount)}`;
}
