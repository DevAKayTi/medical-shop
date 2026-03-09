<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class InventoryLedger extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'shop_id',
        'product_id',
        'batch_id',
        'type',
        'quantity',
        'reference_type',
        'reference_id',
        'balance_after',
        'notes',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function batch()
    {
        return $this->belongsTo(ProductBatch::class, 'batch_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
