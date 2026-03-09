<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'shop_id',
        'category_id',
        'name',
        'generic_name',
        'barcode',
        'sku',
        'medicine_type',
        'manufacturer',
        'unit',
        'mrp',
        'purchase_price',
        'selling_price',
        'tax_rate',
        'is_controlled_drug',
        'prescription_required',
        'description',
        'is_active',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function batches()
    {
        return $this->hasMany(ProductBatch::class);
    }
}
