<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InventoryLedgerController extends Controller
{
    public function index()
    {
        return InventoryLedger::where('shop_id', Auth::user()->shop_id)
            ->with(['product', 'batch.supplier', 'creator'])
            ->latest()
            ->paginate(50);
    }
}
