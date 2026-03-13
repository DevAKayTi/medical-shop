<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class PurchaseReturnController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:read-returns', only: ['index', 'show']),
            new Middleware('can:create-returns', only: ['store']),
            new Middleware('can:complete-returns', only: ['complete']),
        ];
    }
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * List all purchase returns for the shop.
     */
    public function index(Request $request)
    {
        $query = PurchaseReturn::where('shop_id', Auth::user()->shop_id)
            ->with(['purchase', 'supplier', 'returnedBy'])
            ->latest();

        if ($request->filled('purchase_id')) {
            $query->where('purchase_id', $request->purchase_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return $query->paginate(20);
    }

    /**
     * Create a new purchase return with items.
     * If status is 'completed', deducts stock accordingly.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_id'               => 'required|uuid|exists:purchases,id',
            'supplier_id'               => 'required|uuid|exists:suppliers,id',
            'return_number'             => 'required|string|max:100',
            'total'                     => 'required|numeric|min:0',
            'reason'                    => 'nullable|string',
            'status'                    => 'sometimes|in:pending,completed',
            'items'                     => 'required|array|min:1',
            'items.*.purchase_item_id'  => 'required|uuid|exists:purchase_items,id',
            'items.*.product_id'        => 'required|uuid|exists:products,id',
            'items.*.batch_id'          => 'nullable|uuid|exists:product_batches,id',
            'items.*.quantity'          => 'required|integer|min:1',
            'items.*.price'             => 'required|numeric|min:0',
            'items.*.total'             => 'required|numeric|min:0',
        ]);

        $shopId = Auth::user()->shop_id;
        $userId = Auth::id();
        $status = $validated['status'] ?? 'pending';

        // Ensure purchase belongs to this shop
        $purchase = Purchase::where('id', $validated['purchase_id'])
            ->where('shop_id', $shopId)
            ->firstOrFail();

        $return = DB::transaction(function () use ($validated, $shopId, $userId, $status, $purchase) {
            $return = PurchaseReturn::create([
                'shop_id'       => $shopId,
                'purchase_id'   => $purchase->id,
                'supplier_id'   => $validated['supplier_id'],
                'return_number' => $validated['return_number'],
                'total'         => $validated['total'],
                'reason'        => $validated['reason'] ?? null,
                'status'        => $status,
                'returned_by'   => $userId,
            ]);

            foreach ($validated['items'] as $item) {
                PurchaseReturnItem::create([
                    'purchase_return_id' => $return->id,
                    'purchase_item_id'   => $item['purchase_item_id'],
                    'product_id'         => $item['product_id'],
                    'batch_id'           => $item['batch_id'] ?? null,
                    'quantity'           => $item['quantity'],
                    'price'              => $item['price'],
                    'total'              => $item['total'],
                    'created_at'         => now(),
                ]);

                // Deduct stock when return is immediately completed
                if ($status === 'completed') {
                    $this->inventoryService->adjustStock(
                        $shopId,
                        $item['product_id'],
                        $item['batch_id'] ?? null,
                        $item['quantity'],
                        'debit',
                        'purchase_return',
                        $return->id,
                        "Purchase Return #{$return->return_number}",
                        $userId
                    );
                }
            }

            return $return;
        });

        return response()->json($return->load(['purchase', 'supplier', 'items.product', 'items.batch', 'returnedBy']), 201);
    }

    /**
     * Show a single purchase return with items.
     */
    public function show(PurchaseReturn $purchaseReturn)
    {
        if ($purchaseReturn->shop_id !== Auth::user()->shop_id) {
            abort(403);
        }

        return response()->json($purchaseReturn->load(['purchase', 'supplier', 'items.product', 'items.batch', 'returnedBy']));
    }

    /**
     * Mark a pending return as completed (deducts stock).
     */
    public function complete(PurchaseReturn $purchaseReturn)
    {
        if ($purchaseReturn->shop_id !== Auth::user()->shop_id) {
            abort(403);
        }

        if ($purchaseReturn->status !== 'pending') {
            return response()->json(['message' => 'Only pending returns can be completed.'], 422);
        }

        $shopId = Auth::user()->shop_id;
        $userId = Auth::id();

        DB::transaction(function () use ($purchaseReturn, $shopId, $userId) {
            $purchaseReturn->update(['status' => 'completed']);

            foreach ($purchaseReturn->items as $item) {
                $this->inventoryService->adjustStock(
                    $shopId,
                    $item->product_id,
                    $item->batch_id,
                    $item->quantity,
                    'debit',
                    'purchase_return',
                    $purchaseReturn->id,
                    "Purchase Return #{$purchaseReturn->return_number} completed",
                    $userId
                );
            }
        });

        return response()->json($purchaseReturn->fresh()->load(['purchase', 'supplier', 'items.product', 'items.batch']));
    }
}
