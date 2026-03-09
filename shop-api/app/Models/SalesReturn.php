<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SalesReturn extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'shop_id',
        'sale_id',
        'return_number',
        'total',
        'reason',
        'cashier_id',
        'returned_at',
    ];

    protected $casts = [
        'total'       => 'decimal:2',
        'returned_at' => 'datetime',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function items()
    {
        return $this->hasMany(SalesReturnItem::class, 'return_id');
    }
}
