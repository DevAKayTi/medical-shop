<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StockAdjustment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'shop_id',
        'product_id',
        'batch_id',
        'type',
        'quantity',
        'reason',
        'adjusted_by',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function batch()
    {
        return $this->belongsTo(ProductBatch::class, 'batch_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'adjusted_by');
    }
}
