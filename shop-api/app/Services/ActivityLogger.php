<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogger
{
    /**
     * Log an activity.
     *
     * @param string $module
     * @param string $action
     * @param string|null $description
     * @return void
     */
    public static function log($module, $action, $description = null)
    {
        $user = Auth::user();
        $shopId = $user ? $user->shop_id : null;

        // If shop_id is not directly on user, try to get it from context/request
        if (!$shopId && Request::header('X-Shop-ID')) {
            $shopId = Request::header('X-Shop-ID');
        }

        ActivityLog::create([
            'shop_id'     => $shopId,
            'user_type'   => $user ? 'user' : 'system',
            'user_id'     => $user ? $user->id : null,
            'action'      => $action,
            'module'      => $module,
            'description' => $description,
            'ip_address'  => Request::ip(),
            'user_agent'  => Request::userAgent(),
            'created_at'  => now(),
        ]);

        // Mark this request as already logged so the middleware doesn't duplicate it
        Request::instance()->attributes->set('activity_logged', true);
    }
}
