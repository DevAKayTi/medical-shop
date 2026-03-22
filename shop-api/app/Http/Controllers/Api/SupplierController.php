<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class SupplierController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:read-suppliers', only: ['index']),
            new Middleware('can:create-suppliers', only: ['store']),
            new Middleware('can:update-suppliers', only: ['update']),
            new Middleware('can:delete-suppliers', only: ['destroy']),
        ];
    }
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
            'phone'          => 'required|string|max:30',
            'email'          => 'nullable|email|max:191',
            'address'        => 'nullable|string',
            'is_active'      => 'boolean',
        ]);

        $data['shop_id'] = $user->shop_id;
        $supplier = Supplier::create($data);

        ActivityLogger::log('Contact', 'Create Supplier', "Created supplier: {$supplier->name}");

        return response()->json($supplier, 201);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $data = $request->validate([
            'name'           => 'sometimes|string|max:191',
            'contact_person' => 'nullable|string|max:191',
            'phone'          => 'required|string|max:30',
            'email'          => 'nullable|email|max:191',
            'address'        => 'nullable|string',
            'is_active'      => 'boolean',
        ]);

        $supplier->update($data);

        ActivityLogger::log('Contact', 'Update Supplier', "Updated supplier: {$supplier->name}");

        return response()->json($supplier);
    }

    public function destroy(Supplier $supplier)
    {
        $name = $supplier->name;
        $supplier->delete();
        ActivityLogger::log('Contact', 'Delete Supplier', "Deleted supplier: {$name}");
        return response()->json(['message' => 'Supplier deleted.']);
    }
}
