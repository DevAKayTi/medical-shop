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
        'tax_rate',
        'is_controlled_drug',
        'prescription_required',
        'description',
        'is_active',
    ];

    protected $casts = [
        'mrp'                   => 'decimal:2',
        'purchase_price'        => 'decimal:2',
        'tax_rate'              => 'decimal:2',
        'is_controlled_drug'    => 'boolean',
        'prescription_required' => 'boolean',
        'is_active'             => 'boolean',
    ];

    // ─── Relationships ────────────────────────────────────────────────

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function batches()
    {
        return $this->hasMany(ProductBatch::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function salesReturnItems()
    {
        return $this->hasMany(SalesReturnItem::class);
    }

    /**
     * Active (non-expired, is_active=true) batches with stock remaining.
     */
    public function activeBatches()
    {
        return $this->hasMany(ProductBatch::class)
            ->where('is_active', true)
            ->where('expiry_date', '>=', now())
            ->where('quantity', '>', 0)
            ->orderBy('expiry_date'); // FEFO order
    }

    // ─── Computed Helpers ─────────────────────────────────────────────

    /**
     * Total quantity across all batches (loaded or queried).
     */
    public function getTotalStockAttribute(): int
    {
        if ($this->relationLoaded('batches')) {
            return $this->batches->sum('quantity');
        }
        return $this->batches()->sum('quantity');
    }
}
