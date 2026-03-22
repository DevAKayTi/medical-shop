<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * List recent notifications for the authenticated user's shop.
     */
    public function index(Request $request)
    {
        $shopId = Auth::user()->shop_id;

        $notifications = Notification::where('shop_id', $shopId)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json($notifications);
    }

    /**
     * Count of unread notifications.
     */
    public function unreadCount()
    {
        $shopId = Auth::user()->shop_id;

        $count = Notification::where('shop_id', $shopId)
            ->unread()
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Notification $notification)
    {
        abort_unless($notification->shop_id === Auth::user()->shop_id, 403);

        $notification->markAsRead();

        return response()->json($notification->fresh());
    }

    /**
     * Mark all notifications for this shop as read.
     */
    public function markAllAsRead()
    {
        $shopId = Auth::user()->shop_id;

        Notification::where('shop_id', $shopId)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
