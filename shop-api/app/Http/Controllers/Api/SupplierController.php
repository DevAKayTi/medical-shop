<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $suppliers = Supplier::where('shop_id', $user->shop_id)
            ->orderBy('name')
            ->get();
        return response()->json($suppliers);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name'           => 'required|string|max:191',
            'contact_person' => 'nullable|string|max:191',
            'phone'          => 'nullable|string|max:30',
            'email'          => 'nullable|email|max:191',
            'address'        => 'nullable|string',
            'is_active'      => 'boolean',
        ]);

        $data['shop_id'] = $user->shop_id;
        $supplier = Supplier::create($data);
        return response()->json($supplier, 201);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $data = $request->validate([
            'name'           => 'sometimes|string|max:191',
            'contact_person' => 'nullable|string|max:191',
            'phone'          => 'nullable|string|max:30',
            'email'          => 'nullable|email|max:191',
            'address'        => 'nullable|string',
            'is_active'      => 'boolean',
        ]);

        $supplier->update($data);
        return response()->json($supplier);
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();
        return response()->json(['message' => 'Supplier deleted.']);
    }
}
