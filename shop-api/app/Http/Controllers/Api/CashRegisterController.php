<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashRegister;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CashRegisterController extends Controller
{
    public function index(Request $request)
    {
        $query = CashRegister::where('shop_id', Auth::user()->shop_id);

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        return $query->orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:191',
            'is_active' => 'boolean',
        ]);

        $data['shop_id'] = Auth::user()->shop_id;

        return response()->json(CashRegister::create($data), 201);
    }

    public function update(Request $request, CashRegister $cashRegister)
    {
        abort_unless($cashRegister->shop_id === Auth::user()->shop_id, 403, 'Forbidden.');

        $data = $request->validate([
            'name'      => 'sometimes|string|max:191',
            'is_active' => 'boolean',
        ]);

        $cashRegister->update($data);
        return response()->json($cashRegister);
    }

    public function destroy(CashRegister $cashRegister)
    {
        abort_unless($cashRegister->shop_id === Auth::user()->shop_id, 403, 'Forbidden.');
        
        // Prevent deleting if there are associations (like shift sessions)
        if ($cashRegister->sessions()->exists()) {
            return response()->json(['message' => 'Cannot delete register with existing shift sessions. Please deactivate it instead.'], 400);
        }

        $cashRegister->delete();
        return response()->json(['message' => 'Cash register deleted.']);
    }
}
