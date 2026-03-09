<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasUuids;

    protected $connection = 'pos_db';

    public $timestamps = false;

    protected $fillable = [
        'shop_id',
        'user_type',
        'user_id',
        'action',
        'module',
        'description',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Get the shop that the action belongs to.
     */
    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
