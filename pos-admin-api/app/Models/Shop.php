<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shop extends Model
{
    use HasUuids, SoftDeletes;

    /**
     * Use the pos_db secondary connection (shop-api's shop_db).
     */
    protected $connection = 'pos_db';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'country',
        'city',
        'slug',
        'logo_url',
        'status',
        'owner_id',
        'approved_at',
        'approved_by',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];
}
