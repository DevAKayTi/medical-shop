<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::where('shop_id', Auth::user()->shop_id)
            ->withCount(['sales']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('name')->paginate(50);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:191',
            'phone'         => 'required|string|max:30|unique:customers,phone,NULL,id,shop_id,' . Auth::user()->shop_id,
            'email'         => 'nullable|email|max:191|unique:customers,email,NULL,id,shop_id,' . Auth::user()->shop_id,
            'date_of_birth' => 'nullable|date',
            'gender'        => 'nullable|in:male,female,other',
            'address'       => 'nullable|string',
            'loyalty_points'=> 'sometimes|integer|min:0',
        ]);

        $data['shop_id'] = Auth::user()->shop_id;

        return response()->json(Customer::create($data), 201);
    }

    public function show(Customer $customer)
    {
        $this->authorizeShop($customer);
        return response()->json(
            $customer->load(['sales' => fn($q) => $q->with('items.product')->latest()->limit(50)])
        );
    }

    public function update(Request $request, Customer $customer)
    {
        $this->authorizeShop($customer);

        $data = $request->validate([
            'name'          => 'sometimes|string|max:191',
            'phone'         => 'required|string|max:30|unique:customers,phone,' . $customer->id . ',id,shop_id,' . Auth::user()->shop_id,
            'email'         => 'nullable|email|max:191|unique:customers,email,' . $customer->id . ',id,shop_id,' . Auth::user()->shop_id,
            'date_of_birth' => 'nullable|date',
            'gender'        => 'nullable|in:male,female,other',
            'address'       => 'nullable|string',
            'loyalty_points'=> 'sometimes|integer|min:0',
        ]);

        $customer->update($data);
        return response()->json($customer);
    }

    public function destroy(Customer $customer)
    {
        $this->authorizeShop($customer);
        $customer->delete();
        return response()->json(['message' => 'Customer deleted.']);
    }

    private function authorizeShop(Customer $customer): void
    {
        abort_unless($customer->shop_id === Auth::user()->shop_id, 403, 'Forbidden.');
    }
}
