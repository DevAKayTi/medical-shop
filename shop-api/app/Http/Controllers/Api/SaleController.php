<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Customer;
use App\Models\ProductBatch;
use App\Models\InventoryLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SaleController extends Controller
{
    // ─── List ────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = Sale::where('shop_id', Auth::user()->shop_id)
            ->with(['customer', 'cashier'])
            ->latest('sold_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('sold_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('sold_at', '<=', $request->date_to);
        }

        return $query->paginate(30);
    }

    // ─── Show detail ─────────────────────────────────────────────────

    public function show(Sale $sale)
    {
        $this->authorizeShop($sale);
        return response()->json(
            $sale->load(['customer', 'cashier', 'items.product', 'items.batch', 'payments', 'returns.items'])
        );
    }

    // ─── Create Sale (POS Checkout) ───────────────────────────────────

    public function store(Request $request)
    {
        $shopId = Auth::user()->shop_id;
        $cashierId = Auth::id();

        $validated = $request->validate([
            'customer_id'       => 'nullable|uuid|exists:customers,id',
            'session_id'        => 'nullable|uuid|exists:shift_sessions,id',
            'register_id'       => 'nullable|uuid|exists:cash_registers,id',
            'subtotal'          => 'required|numeric|min:0',
            'discount'          => 'sometimes|numeric|min:0',
            'tax'               => 'sometimes|numeric|min:0',
            'total'             => 'required|numeric|min:0',
            'amount_paid'       => 'required|numeric|min:0',
            'change_amount'     => 'sometimes|numeric|min:0',
            'notes'             => 'nullable|string',
            'sold_at'           => 'nullable|date',
            'items'             => 'required|array|min:1',
            'items.*.product_id'    => 'required|uuid|exists:products,id',
            'items.*.batch_id'      => 'nullable|uuid|exists:product_batches,id',
            'items.*.quantity'      => 'required|integer|min:1',
            'items.*.unit_price'    => 'required|numeric|min:0',
            'items.*.discount'      => 'sometimes|numeric|min:0',
            'items.*.tax'           => 'sometimes|numeric|min:0',
            'items.*.total'         => 'required|numeric|min:0',
            'payments'              => 'sometimes|array',
            'payments.*.method'     => 'required|string',
            'payments.*.amount'     => 'required|numeric|min:0',
            'payments.*.reference'  => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Generate invoice number
            $prefix = 'INV-' . date('Ymd') . '-';
            $lastInvoice = Sale::where('shop_id', $shopId)
                ->where('invoice_number', 'like', $prefix . '%')
                ->max('invoice_number');
            $seq = $lastInvoice ? ((int) substr($lastInvoice, -4)) + 1 : 1;
            $invoiceNumber = $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);

            $sale = Sale::create([
                'shop_id'        => $shopId,
                'invoice_number' => $invoiceNumber,
                'customer_id'    => $validated['customer_id'] ?? null,
                'session_id'     => $validated['session_id'] ?? null,
                'register_id'    => $validated['register_id'] ?? null,
                'cashier_id'     => $cashierId,
                'subtotal'       => $validated['subtotal'],
                'discount'       => $validated['discount'] ?? 0,
                'tax'            => $validated['tax'] ?? 0,
                'total'          => $validated['total'],
                'amount_paid'    => $validated['amount_paid'],
                'change_amount'  => $validated['change_amount'] ?? max(0, $validated['amount_paid'] - $validated['total']),
                'status'         => 'completed',
                'notes'          => $validated['notes'] ?? null,
                'sold_at'        => $validated['sold_at'] ?? now(),
            ]);

            // Create sale items & deduct stock (FEFO)
            foreach ($validated['items'] as $item) {
                SaleItem::create([
                    'shop_id'    => $shopId,
                    'sale_id'    => $sale->id,
                    'product_id' => $item['product_id'],
                    'batch_id'   => $item['batch_id'] ?? null,
                    'quantity'   => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount'   => $item['discount'] ?? 0,
                    'tax'        => $item['tax'] ?? 0,
                    'total'      => $item['total'],
                    'created_at' => now(),
                ]);

                // Deduct from specified batch or FEFO
                if (!empty($item['batch_id'])) {
                    $batch = ProductBatch::find($item['batch_id']);
                    if ($batch) {
                        $batch->decrement('quantity', $item['quantity']);
                    }
                } else {
                    // FEFO: deduct from earliest expiring active batch
                    $remaining = $item['quantity'];
                    $batches = ProductBatch::where('product_id', $item['product_id'])
                        ->where('shop_id', $shopId)
                        ->where('is_active', true)
                        ->where('quantity', '>', 0)
                        ->where('expiry_date', '>=', now())
                        ->orderBy('expiry_date')
                        ->get();

                    foreach ($batches as $batch) {
                        if ($remaining <= 0) break;
                        $deduct = min($remaining, $batch->quantity);
                        $batch->decrement('quantity', $deduct);
                        $remaining -= $deduct;
                    }
                }

                // InventoryLedger entry
                InventoryLedger::create([
                    'shop_id'    => $shopId,
                    'product_id' => $item['product_id'],
                    'batch_id'   => $item['batch_id'] ?? null,
                    'type'       => 'sale',
                    'quantity'   => -$item['quantity'],
                    'note'       => "Sale #{$sale->invoice_number}",
                    'user_id'    => $cashierId,
                ]);
            }

            // Payments
            if (!empty($validated['payments'])) {
                foreach ($validated['payments'] as $pay) {
                    SalePayment::create([
                        'shop_id'   => $shopId,
                        'sale_id'   => $sale->id,
                        'method'    => $pay['method'],
                        'amount'    => $pay['amount'],
                        'reference' => $pay['reference'] ?? null,
                        'paid_at'   => now(),
                        'created_at'=> now(),
                    ]);
                }
            }

            // Update customer loyalty & total_spent
            if ($validated['customer_id'] ?? null) {
                $customer = Customer::find($validated['customer_id']);
                if ($customer) {
                    $pointsEarned = (int) floor($validated['total'] / 10);
                    $customer->increment('loyalty_points', $pointsEarned);
                    $customer->increment('total_spent', $validated['total']);
                }
            }

            DB::commit();
            return response()->json(
                $sale->load(['customer', 'items.product', 'items.batch', 'payments']),
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Checkout failed.', 'error' => $e->getMessage()], 500);
        }
    }

    // ─── Void / Cancel ────────────────────────────────────────────────

    public function destroy(Sale $sale)
    {
        $this->authorizeShop($sale);
        abort_if($sale->status !== 'completed', 422, 'Only completed sales can be voided.');

        $sale->update(['status' => 'refunded']);
        return response()->json(['message' => 'Sale voided.']);
    }

    private function authorizeShop(Sale $sale): void
    {
        abort_unless($sale->shop_id === Auth::user()->shop_id, 403, 'Forbidden.');
    }
}
