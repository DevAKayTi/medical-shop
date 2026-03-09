<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoginLog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'login_logs';

    public $timestamps = false; // Using custom logged_in_at only

    protected $fillable = [
        'user_type',
        'user_id',
        'ip_address',
        'device_info',
        'success',
        'failure_reason',
        'logged_in_at',
    ];

    protected $casts = [
        'success' => 'boolean',
        'logged_in_at' => 'datetime',
    ];
}
