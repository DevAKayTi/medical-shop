<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class StockAdjustmentController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index()
    {
        return StockAdjustment::where('shop_id', Auth::user()->shop_id)
            ->with(['product', 'batch.supplier'])
            ->latest()
            ->paginate(20);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'batch_id' => 'nullable|exists:product_batches,id',
            'type' => 'required|in:increase,decrease,write_off,correction',
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string',
        ]);

        $shopId = Auth::user()->shop_id;
        $userId = Auth::id();

        // Determine ledger type
        $ledgerType = ($validated['type'] === 'increase' || $validated['type'] === 'correction' && $validated['quantity'] > 0) ? 'credit' : 'debit';
        
        // Note: For 'correction', we might need to handle it better, but simple increase/decrease works for now.
        // If it's a 'decrease' or 'write_off', it's always a debit.
        if ($validated['type'] === 'decrease' || $validated['type'] === 'write_off') {
            $ledgerType = 'debit';
        }

        $adjustment = StockAdjustment::create([
            'id' => Str::uuid(),
            'shop_id' => $shopId,
            'product_id' => $validated['product_id'],
            'batch_id' => $validated['batch_id'],
            'type' => $validated['type'],
            'quantity' => $validated['quantity'],
            'reason' => $validated['reason'],
            'adjusted_by' => $userId,
        ]);

        $this->inventoryService->adjustStock(
            $shopId,
            $validated['product_id'],
            $validated['batch_id'],
            $validated['quantity'],
            $ledgerType,
            'adjustment',
            $adjustment->id,
            $validated['reason'],
            $userId
        );

        return response()->json($adjustment->load(['product', 'batch']), 201);
    }
}
