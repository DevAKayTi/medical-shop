<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShiftSession;
use App\Models\CashRegister;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ShiftSessionController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:read-shifts', only: ['index', 'show']),
            new Middleware('can:open-shift', only: ['store']),
            new Middleware('can:close-shift', only: ['close']),
        ];
    }
    public function index(Request $request)
    {
        $query = ShiftSession::where('shop_id', Auth::user()->shop_id)
            ->with(['register', 'user']);

        // Check if user is admin/manager to see all, otherwise restrict to own
        if (!Auth::user()->hasRole('admin|manager')) {
             $query->where('user_id', Auth::user()->id);
        } elseif ($request->has('user_id')) {
             $query->where('user_id', $request->user_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return $query->latest('opened_at')->paginate(20);
    }

    public function show(ShiftSession $shiftSession)
    {
        abort_unless($shiftSession->shop_id === Auth::user()->shop_id, 403, 'Forbidden.');
        return response()->json($shiftSession->load(['register', 'user']));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'register_id'  => 'required|exists:cash_registers,id',
            'opening_cash' => 'nullable|numeric|min:0',
            'notes'        => 'nullable|string',
        ]);

        $register = CashRegister::where('id', $data['register_id'])
            ->where('shop_id', Auth::user()->shop_id)
            ->firstOrFail();

        // Check if the user already has an open session
        $existingSession = ShiftSession::where('user_id', Auth::user()->id)
            ->where('status', 'open')
            ->first();

        if ($existingSession) {
            return response()->json(['message' => 'You already have an open shift session.'], 400);
        }

        // Check if the register is already in use by another open session
        $registerInUse = ShiftSession::where('register_id', $register->id)
            ->where('status', 'open')
            ->first();

        if ($registerInUse) {
            return response()->json(['message' => 'This cash register is currently in use by another open shift.'], 400);
        }

        $session = ShiftSession::create([
            'shop_id'       => Auth::user()->shop_id,
            'register_id'   => $register->id,
            'user_id'       => Auth::user()->id,
            'opening_cash'  => $data['opening_cash'] ?? 0,
            'opened_at'     => Carbon::now(),
            'status'        => 'open',
            'notes'         => $data['notes'] ?? null,
        ]);

        return response()->json($session->load(['register', 'user']), 201);
    }

    public function close(Request $request, ShiftSession $shiftSession)
    {
        abort_unless($shiftSession->shop_id === Auth::user()->shop_id, 403, 'Forbidden.');

        if ($shiftSession->status === 'closed') {
            return response()->json(['message' => 'This shift session is already closed.'], 400);
        }

        abort_unless($shiftSession->user_id === Auth::user()->id || Auth::user()->hasRole('admin'), 403, 'You can only close your own shift.');

        $data = $request->validate([
            'closing_cash' => 'required|numeric|min:0',
            'notes'        => 'nullable|string',
        ]);

        $shiftSession->update([
            'closing_cash'  => $data['closing_cash'],
            'closed_at'     => Carbon::now(),
            'status'        => 'closed',
            'notes'         => $data['notes'] ?? $shiftSession->notes,
        ]);

        return response()->json($shiftSession->load(['register', 'user']));
    }
}
