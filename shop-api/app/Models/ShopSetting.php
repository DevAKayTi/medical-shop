<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopSetting extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'shop_id',
        'currency',
        'tax_rate',
        'invoice_prefix',
        'invoice_counter',
        'low_stock_threshold',
        'timezone',
        'receipt_footer',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }
}
