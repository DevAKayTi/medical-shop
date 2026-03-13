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
}
