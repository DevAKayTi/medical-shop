<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Represents a shop user stored in shop_db.
 * Used by pos-admin-api to create/manage shop users.
 */
class ShopUser extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $connection = 'pos_db';

    protected $table = 'users';

    protected $fillable = [
        'shop_id',
        'name',
        'email',
        'phone',
        'password',
        'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the shop this user belongs to.
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'shop_id');
    }
}
