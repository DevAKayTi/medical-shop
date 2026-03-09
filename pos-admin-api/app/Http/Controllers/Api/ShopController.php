<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Models\ShopSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ShopController extends Controller
{
    /**
     * Create a new shop in shop_db with default settings.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:191',
            'email'   => 'required|email|max:191|unique:pos_db.shops,email',
            'phone'   => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'country' => 'nullable|string|max:100',
            'city'    => 'nullable|string|max:100',
        ]);

        // Auto-generate unique slug from shop name
        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (Shop::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter++;
        }

        $shop = Shop::create(array_merge($validated, [
            'slug'   => $slug,
            'status' => 'pending',
        ]));

        // Create default shop settings
        ShopSetting::create([
            'shop_id'             => $shop->id,
            'currency'            => 'USD',
            'tax_rate'            => 0.00,
            'invoice_prefix'      => 'INV-',
            'invoice_counter'     => 1,
            'low_stock_threshold' => 10,
            'timezone'            => 'UTC',
        ]);

        return response()->json([
            'message' => 'Shop created successfully.',
            'shop'    => $shop,
        ], 201);
    }

    /**
     * List all shops from shop_db with optional filters.
     */
    public function index(Request $request)
    {
        $query = Shop::query();

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($q2) use ($q) {
                $q2->where('name', 'like', "%{$q}%")
                   ->orWhere('email', 'like', "%{$q}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $shops = $query->orderBy('created_at', 'desc')
                       ->paginate($request->get('per_page', 15));

        return response()->json($shops);
    }

    /**
     * Show a single shop.
     */
    public function show(string $id)
    {
        return response()->json(Shop::findOrFail($id));
    }

    /**
     * Approve a shop (set status → active).
     */
    public function approve(Request $request, string $id)
    {
        $shop = Shop::findOrFail($id);
        $shop->update([
            'status'      => 'active',
            'approved_at' => now(),
            'approved_by' => $request->user()?->id,
        ]);

        return response()->json([
            'message' => 'Shop approved successfully.',
            'shop'    => $shop,
        ]);
    }

    /**
     * Suspend a shop (set status → suspended).
     */
    public function suspend(string $id)
    {
        $shop = Shop::findOrFail($id);
        $shop->update(['status' => 'suspended']);

        return response()->json([
            'message' => 'Shop suspended.',
            'shop'    => $shop,
        ]);
    }
    /**
     * Update an existing shop.
     */
    public function update(Request $request, string $id)
    {
        $shop = Shop::findOrFail($id);
        
        $validated = $request->validate([
            'name'    => 'sometimes|required|string|max:191',
            'email'   => 'sometimes|required|email|max:191|unique:pos_db.shops,email,' . $id,
            'phone'   => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'country' => 'nullable|string|max:100',
            'city'    => 'nullable|string|max:100',
        ]);

        $shop->update($validated);

        return response()->json([
            'message' => 'Shop updated successfully.',
            'shop'    => $shop,
        ]);
    }

    /**
     * Delete a shop (soft delete).
     */
    public function destroy(string $id)
    {
        $shop = Shop::findOrFail($id);
        
        // Prevent deleting active/approved shops if that's a business rule?
        // OR just allow deleting any shop. For now, we allow.

        $shop->delete();

        return response()->json([
            'message' => 'Shop deleted successfully.',
        ]);
    }
}
