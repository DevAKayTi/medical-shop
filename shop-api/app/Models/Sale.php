<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Sale extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'shop_id',
        'invoice_number',
        'customer_id',
        'session_id',
        'register_id',
        'cashier_id',
        'subtotal',
        'discount',
        'tax',
        'total',
        'amount_paid',
        'change_amount',
        'status',
        'notes',
        'sold_at',
    ];

    protected $casts = [
        'subtotal'      => 'decimal:2',
        'discount'      => 'decimal:2',
        'tax'           => 'decimal:2',
        'total'         => 'decimal:2',
        'amount_paid'   => 'decimal:2',
        'change_amount' => 'decimal:2',
        'sold_at'       => 'datetime',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function session()
    {
        return $this->belongsTo(ShiftSession::class, 'session_id');
    }

    public function register()
    {
        return $this->belongsTo(CashRegister::class, 'register_id');
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments()
    {
        return $this->hasMany(SalePayment::class);
    }

    public function returns()
    {
        return $this->hasMany(SalesReturn::class);
    }
}
