<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailySalesSummary extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'daily_sales_summary';

    protected $fillable = [
        'shop_id',
        'summary_date',
        'total_sales',
        'total_refunds',
        'total_transactions',
        'cash_collected',
        'card_collected',
        'net_revenue',
    ];

    protected $casts = [
        'summary_date' => 'date',
        'total_sales' => 'decimal:2',
        'total_refunds' => 'decimal:2',
        'total_transactions' => 'integer',
        'cash_collected' => 'decimal:2',
        'card_collected' => 'decimal:2',
        'net_revenue' => 'decimal:2',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
