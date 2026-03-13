<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductBatch;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ProductController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:read-catalog', only: ['index', 'show', 'batches']),
            new Middleware('can:create-catalog', only: ['store', 'storeBatch']),
            new Middleware('can:update-catalog', only: ['update', 'updateBatch']),
            new Middleware('can:delete-catalog', only: ['destroy', 'destroyBatch']),
        ];
    }
    public function index(Request $request)
    {
        $user = $request->user();
        $products = Product::where('shop_id', $user->shop_id)
            ->with(['category', 'batches'])
            ->orderBy('name')
            ->get();
        return response()->json($products);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name'                 => 'required|string|max:191',
            'generic_name'         => 'nullable|string|max:191',
            'barcode'              => [
                'nullable',
                'string',
                'max:191',
                \Illuminate\Validation\Rule::unique('products')->where(fn ($q) => $q->where('shop_id', $user->shop_id))
            ],
            'sku'                  => [
                'nullable',
                'string',
                'max:100',
                \Illuminate\Validation\Rule::unique('products')->where(fn ($q) => $q->where('shop_id', $user->shop_id))
            ],
            'category_id'          => 'nullable|uuid|exists:categories,id',
            'medicine_type'        => 'nullable|in:tablet,capsule,syrup,suspension,injection,infusion,cream,ointment,gel,drops,inhaler,spray,powder,suppository,other',
            'manufacturer'         => 'nullable|string|max:191',
            'unit'                 => 'required|in:piece,strip,box,bottle,vial,ampoule,tube,sachet,pack,pair',
            'mrp'                  => 'required|numeric|min:0',
            'purchase_price'       => 'nullable|numeric|min:0',
            'tax_rate'             => 'nullable|numeric|min:0|max:100',
            'is_controlled_drug'   => 'boolean',
            'prescription_required'=> 'boolean',
            'description'          => 'nullable|string',
            'is_active'            => 'boolean',
        ], [
            'barcode.unique' => 'This barcode is already assigned to another product in your shop.',
            'sku.unique'     => 'This SKU is already assigned to another product in your shop.',
            'mrp.required'   => 'Maximum Retail Price (MRP) is required.',
        ]);

        $data['shop_id'] = $user->shop_id;
        $product = Product::create($data);
        return response()->json($product->load(['category']), 201);
    }

    public function show(Request $request, Product $product)
    {
        return response()->json($product->load(['category', 'batches']));
    }

    public function update(Request $request, Product $product)
    {
        $user = $request->user();
        $data = $request->validate([
            'name'                 => 'sometimes|string|max:191',
            'generic_name'         => 'nullable|string|max:191',
            'barcode'              => [
                'nullable',
                'string',
                'max:191',
                \Illuminate\Validation\Rule::unique('products')
                    ->where(fn ($q) => $q->where('shop_id', $user->shop_id))
                    ->ignore($product->id)
            ],
            'sku'                  => [
                'nullable',
                'string',
                'max:100',
                \Illuminate\Validation\Rule::unique('products')
                    ->where(fn ($q) => $q->where('shop_id', $user->shop_id))
                    ->ignore($product->id)
            ],
            'category_id'          => 'nullable|uuid|exists:categories,id',
            'medicine_type'        => 'nullable|in:tablet,capsule,syrup,suspension,injection,infusion,cream,ointment,gel,drops,inhaler,spray,powder,suppository,other',
            'manufacturer'         => 'nullable|string|max:191',
            'unit'                 => 'required|in:piece,strip,box,bottle,vial,ampoule,tube,sachet,pack,pair',
            'mrp'                  => 'sometimes|numeric|min:0',
            'purchase_price'       => 'nullable|numeric|min:0',
            'tax_rate'             => 'nullable|numeric|min:0|max:100',
            'is_controlled_drug'   => 'boolean',
            'prescription_required'=> 'boolean',
            'description'          => 'nullable|string',
            'is_active'            => 'boolean',
        ], [
            'barcode.unique' => 'This barcode is already assigned to another product in your shop.',
            'sku.unique'     => 'This SKU is already assigned to another product in your shop.',
        ]);

        $product->update($data);
        return response()->json($product->load(['category']));
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['message' => 'Product deleted.']);
    }

    // --- Batches ---

    public function batches(Product $product)
    {
        return response()->json(
            $product->batches()
                ->with(['supplier'])
                ->orderBy('expiry_date')
                ->get()
        );
    }

    public function storeBatch(Request $request, Product $product)
    {
        $user = $request->user();
        $data = $request->validate([
            'batch_number'    => 'required|string|max:100',
            'supplier_id'     => 'nullable|uuid|exists:suppliers,id',
            'manufacture_date'=> 'nullable|date',
            'expiry_date'     => 'required|date',
            'quantity'        => 'required|integer|min:0',
            'purchase_price'  => 'nullable|numeric|min:0',
            'selling_price'   => 'required|numeric|min:0|gte:purchase_price',
            'mrp'             => 'nullable|numeric|min:0',
        ]);

        $data['shop_id']    = $user->shop_id;
        $data['product_id'] = $product->id;

        $batch = ProductBatch::create($data);
        return response()->json($batch->load(['supplier']), 201);
    }

    public function updateBatch(Request $request, ProductBatch $batch)
    {
        $data = $request->validate([
            'batch_number'    => 'sometimes|string|max:100',
            'supplier_id'     => 'nullable|uuid|exists:suppliers,id',
            'manufacture_date'=> 'nullable|date',
            'expiry_date'     => 'sometimes|date',
            'quantity'        => 'sometimes|integer|min:0',
            'purchase_price'  => 'nullable|numeric|min:0',
            'selling_price'   => 'sometimes|numeric|min:0|gte:purchase_price',
            'mrp'             => 'nullable|numeric|min:0',
            'is_active'       => 'boolean',
        ]);

        $batch->update($data);
        return response()->json($batch->load(['supplier']));
    }

    public function destroyBatch(ProductBatch $batch)
    {
        $batch->delete();
        return response()->json(['message' => 'Batch deleted.']);
    }
}
