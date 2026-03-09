<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonthlySalesSummary extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'monthly_sales_summary';

    protected $fillable = [
        'shop_id',
        'year',
        'month',
        'total_sales',
        'total_refunds',
        'total_transactions',
        'net_revenue',
    ];

    protected $casts = [
        'year' => 'integer',
        'month' => 'integer',
        'total_sales' => 'decimal:2',
        'total_refunds' => 'decimal:2',
        'total_transactions' => 'integer',
        'net_revenue' => 'decimal:2',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
