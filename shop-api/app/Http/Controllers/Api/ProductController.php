<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductBatch;
use Illuminate\Http\Request;

class ProductController extends Controller
{
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
            'barcode'              => 'nullable|string|max:191',
            'sku'                  => 'nullable|string|max:100',
            'category_id'          => 'nullable|uuid|exists:categories,id',
            'medicine_type'        => 'nullable|in:tablet,capsule,syrup,injection,cream,drops,other',
            'manufacturer'         => 'nullable|string|max:191',
            'unit'                 => 'nullable|in:strips,bottles,vials,pieces',
            'mrp'                  => 'required|numeric|min:0',
            'purchase_price'       => 'nullable|numeric|min:0',
            'selling_price'        => 'required|numeric|min:0',
            'tax_rate'             => 'nullable|numeric|min:0|max:100',
            'is_controlled_drug'   => 'boolean',
            'prescription_required'=> 'boolean',
            'description'          => 'nullable|string',
            'is_active'            => 'boolean',
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
        $data = $request->validate([
            'name'                 => 'sometimes|string|max:191',
            'generic_name'         => 'nullable|string|max:191',
            'barcode'              => 'nullable|string|max:191',
            'sku'                  => 'nullable|string|max:100',
            'category_id'          => 'nullable|uuid|exists:categories,id',
            'medicine_type'        => 'nullable|in:tablet,capsule,syrup,injection,cream,drops,other',
            'manufacturer'         => 'nullable|string|max:191',
            'unit'                 => 'nullable|in:strips,bottles,vials,pieces',
            'mrp'                  => 'sometimes|numeric|min:0',
            'purchase_price'       => 'nullable|numeric|min:0',
            'selling_price'        => 'sometimes|numeric|min:0',
            'tax_rate'             => 'nullable|numeric|min:0|max:100',
            'is_controlled_drug'   => 'boolean',
            'prescription_required'=> 'boolean',
            'description'          => 'nullable|string',
            'is_active'            => 'boolean',
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
        return response()->json($product->batches()->orderBy('expiry_date')->get());
    }

    public function storeBatch(Request $request, Product $product)
    {
        $user = $request->user();
        $data = $request->validate([
            'batch_number'    => 'required|string|max:100',
            'manufacture_date'=> 'nullable|date',
            'expiry_date'     => 'required|date',
            'quantity'        => 'required|integer|min:0',
            'purchase_price'  => 'nullable|numeric|min:0',
            'mrp'             => 'nullable|numeric|min:0',
        ]);

        $data['shop_id']    = $user->shop_id;
        $data['product_id'] = $product->id;

        $batch = ProductBatch::create($data);
        return response()->json($batch, 201);
    }

    public function updateBatch(Request $request, ProductBatch $batch)
    {
        $data = $request->validate([
            'batch_number'    => 'sometimes|string|max:100',
            'manufacture_date'=> 'nullable|date',
            'expiry_date'     => 'sometimes|date',
            'quantity'        => 'sometimes|integer|min:0',
            'purchase_price'  => 'nullable|numeric|min:0',
            'mrp'             => 'nullable|numeric|min:0',
            'is_active'       => 'boolean',
        ]);

        $batch->update($data);
        return response()->json($batch);
    }

    public function destroyBatch(ProductBatch $batch)
    {
        $batch->delete();
        return response()->json(['message' => 'Batch deleted.']);
    }
}
