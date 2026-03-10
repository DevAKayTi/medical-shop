<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductBatch extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'shop_id',
        'product_id',
        'supplier_id',
        'batch_number',
        'manufacture_date',
        'expiry_date',
        'quantity',
        'purchase_price',
        'selling_price',
        'mrp',
        'is_active',
    ];

    protected $casts = [
        'manufacture_date' => 'date',
        'expiry_date'      => 'date',
        'is_active'        => 'boolean',
        'quantity'         => 'integer',
        'purchase_price'   => 'decimal:2',
        'selling_price'    => 'decimal:2',
        'mrp'              => 'decimal:2',
    ];

    // ─── Relationships ────────────────────────────────────────────────

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * The supplier for this batch can be found via the purchase item that created it.
     * Use: $batch->purchaseItems()->with('purchase.supplier')->first()->purchase->supplier
     */
    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class, 'batch_id');
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class, 'batch_id');
    }

    public function salesReturnItems()
    {
        return $this->hasMany(SalesReturnItem::class, 'batch_id');
    }
}
