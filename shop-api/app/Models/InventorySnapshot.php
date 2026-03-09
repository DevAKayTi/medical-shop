<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventorySnapshot extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'inventory_snapshot';

    public $timestamps = false; // Using custom created_at only

    protected $fillable = [
        'shop_id',
        'product_id',
        'snapshot_date',
        'opening_qty',
        'closing_qty',
        'purchased_qty',
        'sold_qty',
        'adjusted_qty',
        'created_at',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'opening_qty' => 'integer',
        'closing_qty' => 'integer',
        'purchased_qty' => 'integer',
        'sold_qty' => 'integer',
        'adjusted_qty' => 'integer',
        'created_at' => 'datetime',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
