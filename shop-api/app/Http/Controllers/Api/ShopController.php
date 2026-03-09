<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ShopController extends Controller
{
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
}
