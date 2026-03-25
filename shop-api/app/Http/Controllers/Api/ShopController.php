<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ShopController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:read-settings', only: ['show']),
            new Middleware('can:manage-settings', only: ['updateSettings', 'updateProfile']),
        ];
    }

    /**
     * Get the shop belonging to the authenticated user.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user->shop_id) {
            return response()->json(['message' => 'No shop associated with this account.'], 404);
        }

        $shop = $user->shop()->with('settings')->first();

        if (!$shop) {
            return response()->json(['message' => 'Shop not found.'], 404);
        }

        return response()->json($shop);
    }

    /**
     * Update the shop profile (name, email, phone, address, etc.)
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if (!$user->shop_id) {
            return response()->json(['message' => 'No shop associated with this account.'], 404);
        }

        $shop = $user->shop()->with('settings')->first();

        if (!$shop) {
            return response()->json(['message' => 'Shop not found.'], 404);
        }

        $validated = $request->validate([
            'name'     => 'sometimes|string|max:191',
            'email'    => 'sometimes|email|max:191|unique:shops,email,' . $shop->id,
            'phone'    => 'sometimes|nullable|string|max:30',
            'address'  => 'sometimes|nullable|string|max:500',
            'country'  => 'sometimes|nullable|string|max:100',
            'city'     => 'sometimes|nullable|string|max:100',
            'logo_url' => 'sometimes|nullable|url|max:500',
        ]);

        $shop->update($validated);

        // Update shop_info in localStorage hint via response
        return response()->json($shop->fresh(['settings']));
    }

    /**
     * Update the shop settings for the authenticated user's shop.
     */
    public function updateSettings(Request $request)
    {
        $user = $request->user();

        if (!$user->shop_id) {
            return response()->json(['message' => 'No shop associated with this account.'], 404);
        }

        $shop = $user->shop()->with('settings')->first();

        if (!$shop) {
            return response()->json(['message' => 'Shop not found.'], 404);
        }

        $validated = $request->validate([
            'currency'            => 'sometimes|string|max:10',
            'tax_rate'            => 'sometimes|numeric|min:0|max:100',
            'invoice_prefix'      => 'sometimes|string|max:20',
            'invoice_counter'     => 'sometimes|integer|min:1',
            'low_stock_threshold' => 'sometimes|integer|min:0',
            'receipt_footer'      => 'sometimes|nullable|string|max:500',
        ]);

        if ($shop->settings) {
            $shop->settings->update($validated);
        } else {
            $shop->settings()->create(array_merge(['shop_id' => $shop->id], $validated));
        }

        return response()->json($shop->fresh(['settings']));
    }
}
