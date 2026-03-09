<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductBatch extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'supplier_id',
        'batch_number',
        'manufacture_date',
        'expiry_date',
        'quantity',
        'purchase_price',
        'mrp',
        'is_active',
    ];

    protected $casts = [
        'manufacture_date' => 'date',
        'expiry_date' => 'date',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
