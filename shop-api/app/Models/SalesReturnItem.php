<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SalesReturnItem extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false; // Based on migration

    protected $fillable = [
        'return_id',
        'sale_item_id',
        'product_id',
        'batch_id',
        'quantity',
        'unit_price',
        'total',
        'created_at',
    ];

    protected $casts = [
        'quantity'   => 'integer',
        'unit_price' => 'decimal:2',
        'total'      => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function return()
    {
        return $this->belongsTo(SalesReturn::class, 'return_id');
    }

    public function saleItem()
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function batch()
    {
        return $this->belongsTo(ProductBatch::class, 'batch_id');
    }
}
