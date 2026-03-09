<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StockTransfer extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'from_shop_id',
        'to_shop_id',
        'product_id',
        'batch_id',
        'quantity',
        'status',
        'requested_by',
        'approved_by',
        'notes',
    ];
}
