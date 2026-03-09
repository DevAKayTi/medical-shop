<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductSalesSummary extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'product_sales_summary';

    protected $fillable = [
        'shop_id',
        'product_id',
        'summary_date',
        'qty_sold',
        'qty_returned',
        'gross_revenue',
        'net_revenue',
    ];

    protected $casts = [
        'summary_date' => 'date',
        'qty_sold' => 'integer',
        'qty_returned' => 'integer',
        'gross_revenue' => 'decimal:2',
        'net_revenue' => 'decimal:2',
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
