<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\ProductBatch;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PurchaseController extends Controller
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * List all purchases for the authenticated shop.
     */
    public function index(Request $request)
    {
        $query = Purchase::where('shop_id', Auth::user()->shop_id)
            ->with(['supplier', 'createdBy'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        return $query->paginate(20);
    }

    /**
     * Create a new purchase with its items.
     * Receiving stock updates inventory via InventoryService.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id'           => 'required|uuid|exists:suppliers,id',
            'purchase_number'       => 'required|string|max:100',
            'status'                => 'sometimes|in:pending,received,cancelled',
            'subtotal'              => 'required|numeric|min:0',
            'discount'              => 'sometimes|numeric|min:0',
            'tax'                   => 'sometimes|numeric|min:0',
            'total'                 => 'required|numeric|min:0',
            'purchased_at'          => 'nullable|date',
            'received_at'           => 'nullable|date',
            'notes'                 => 'nullable|string',
            'items'                 => 'required|array|min:1',
            'items.*.product_id'    => 'required|uuid|exists:products,id',
            'items.*.batch_id'      => 'nullable|uuid|exists:product_batches,id',
            'items.*.quantity'      => 'required|integer|min:1',
            'items.*.purchase_price'=> 'required|numeric|min:0',
            'items.*.selling_price' => 'nullable|numeric|min:0',
            'items.*.mrp'           => 'nullable|numeric|min:0',
            'items.*.total'         => 'required|numeric|min:0',
            'items.*.batch_number'  => 'nullable|string|max:100',
            'items.*.manufacture_date' => 'nullable|date',
            'items.*.expiry_date'   => 'nullable|date',
        ]);

        $shopId = Auth::user()->shop_id;
        $userId = Auth::id();
        $status = $validated['status'] ?? 'pending';

        $purchase = DB::transaction(function () use ($validated, $shopId, $userId, $status) {
            $purchase = Purchase::create([
                'shop_id'         => $shopId,
                'supplier_id'     => $validated['supplier_id'],
                'purchase_number' => $validated['purchase_number'],
                'status'          => $status,
                'subtotal'        => $validated['subtotal'],
                'discount'        => $validated['discount'] ?? 0,
                'tax'             => $validated['tax'] ?? 0,
                'total'           => $validated['total'],
                'purchased_at'    => $validated['purchased_at'] ?? null,
                'received_at'     => $validated['received_at'] ?? null,
                'notes'           => $validated['notes'] ?? null,
                'created_by'      => $userId,
            ]);

            foreach ($validated['items'] as $itemData) {
                $batchId = $itemData['batch_id'] ?? null;

                // Resolve or create batch if details are provided
                if (!$batchId && !empty($itemData['batch_number'])) {
                    $batch = ProductBatch::firstOrCreate(
                        [
                            'shop_id'      => $shopId,
                            'product_id'   => $itemData['product_id'],
                            'batch_number' => $itemData['batch_number'],
                            'expiry_date'  => $itemData['expiry_date'],
                        ],
                        [
                            'id'               => Str::uuid(),
                            'supplier_id'      => $purchase->supplier_id,
                            'manufacture_date' => $itemData['manufacture_date'] ?? null,
                            'purchase_price'   => $itemData['purchase_price'] ?? null,
                            'selling_price'    => $itemData['selling_price'] ?? null,
                            'mrp'              => $itemData['mrp'] ?? null,
                            'quantity'         => 0, // Will be incremented by InventoryService
                        ]
                    );
                    $batchId = $batch->id;
                }

                $purchaseItem = PurchaseItem::create([
                    'shop_id'         => $shopId,
                    'purchase_id'     => $purchase->id,
                    'product_id'      => $itemData['product_id'],
                    'batch_id'        => $batchId,
                    'quantity'        => $itemData['quantity'],
                    'purchase_price'  => $itemData['purchase_price'],
                    'mrp'             => $itemData['mrp'] ?? null,
                    'total'           => $itemData['total'],
                    'batch_number'    => $itemData['batch_number'] ?? null,
                    'manufacture_date'=> $itemData['manufacture_date'] ?? null,
                    'expiry_date'     => $itemData['expiry_date'] ?? null,
                    'created_at'      => now(),
                ]);

                // Credit stock when purchase is received immediately
                if ($status === 'received') {
                    $this->inventoryService->adjustStock(
                        $shopId,
                        $itemData['product_id'],
                        $batchId,
                        $itemData['quantity'],
                        'credit',
                        'purchase',
                        $purchase->id,
                        "Purchase #{$purchase->purchase_number}",
                        $userId
                    );
                }
            }

            return $purchase;
        });

        return response()->json($purchase->load(['supplier', 'items.product', 'items.batch', 'createdBy']), 201);
    }

    /**
     * Show a single purchase with its items.
     */
    public function show(Purchase $purchase)
    {
        if ($purchase->shop_id !== Auth::user()->shop_id) {
            abort(403);
        }

        return response()->json($purchase->load(['supplier', 'items.product', 'items.batch', 'returns']));
    }

    /**
     * Update a purchase (e.g. change status to received or cancelled).
     * Marks stock received when status changes to 'received'.
     */
    public function update(Request $request, Purchase $purchase)
    {
        if ($purchase->shop_id !== Auth::user()->shop_id) {
            abort(403);
        }

        $validated = $request->validate([
            'status'       => 'sometimes|in:pending,received,cancelled',
            'received_at'  => 'nullable|date',
            'notes'        => 'nullable|string',
            'discount'     => 'sometimes|numeric|min:0',
            'tax'          => 'sometimes|numeric|min:0',
            'total'        => 'sometimes|numeric|min:0',
        ]);

        $previousStatus = $purchase->status;

        DB::transaction(function () use ($purchase, $validated, $previousStatus) {
            $purchase->update($validated);

            // Credit stock when status changes to received for the first time
            if (isset($validated['status']) && $validated['status'] === 'received' && $previousStatus !== 'received') {
                $shopId = Auth::user()->shop_id;
                $userId = Auth::id();

                foreach ($purchase->items as $item) {
                    $this->inventoryService->adjustStock(
                        $shopId,
                        $item->product_id,
                        $item->batch_id,
                        $item->quantity,
                        'credit',
                        'purchase',
                        $purchase->id,
                        "Purchase #{$purchase->purchase_number} received",
                        $userId
                    );
                }
            }
        });

        return response()->json($purchase->fresh()->load(['supplier', 'items.product', 'items.batch']));
    }

    /**
     * Soft-delete a purchase (only if still pending).
     */
    public function destroy(Purchase $purchase)
    {
        if ($purchase->shop_id !== Auth::user()->shop_id) {
            abort(403);
        }

        if ($purchase->status !== 'pending') {
            return response()->json(['message' => 'Only pending purchases can be deleted.'], 422);
        }

        $purchase->delete();

        return response()->json(['message' => 'Purchase deleted.']);
    }
}
