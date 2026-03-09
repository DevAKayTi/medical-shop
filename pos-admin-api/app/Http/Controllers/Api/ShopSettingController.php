<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShopSetting;
use Illuminate\Http\Request;

class ShopSettingController extends Controller
{
    /**
     * Get settings for a specific shop.
     */
    public function show(string $shopId)
    {
        $settings = ShopSetting::firstOrCreate(
            ['shop_id' => $shopId],
            [
                'currency'            => 'USD',
                'tax_rate'            => 0.00,
                'invoice_prefix'      => 'INV-',
                'invoice_counter'     => 1,
                'low_stock_threshold' => 10,
                'timezone'            => 'UTC',
            ]
        );
        return response()->json($settings);
    }

    /**
     * Update settings for a specific shop.
     */
    public function update(Request $request, string $shopId)
    {
        $settings = ShopSetting::where('shop_id', $shopId)->firstOrFail();

        $validated = $request->validate([
            'currency'            => 'sometimes|required|string|max:10',
            'tax_rate'            => 'sometimes|required|numeric|min:0|max:100',
            'invoice_prefix'      => 'sometimes|required|string|max:20',
            'invoice_counter'     => 'sometimes|required|integer|min:1',
            'low_stock_threshold' => 'sometimes|required|integer|min:0',
            'timezone'            => 'sometimes|required|string|max:100',
            'receipt_footer'      => 'nullable|string',
        ]);

        $settings->update($validated);

        return response()->json([
            'message'  => 'Shop settings updated successfully.',
            'settings' => $settings,
        ]);
    }
}
