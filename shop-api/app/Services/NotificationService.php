<?php

namespace App\Services;

use App\Events\NotificationEvent;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class NotificationService
{
    /**
     * Save a notification to the DB and broadcast it via Reverb.
     * The broadcast is best-effort — if Reverb is down, the DB record is still saved.
     *
     * @param string      $shopId
     * @param string      $type     sale | purchase | low_stock | user | system
     * @param string      $title    Short title
     * @param string|null $message  Longer description
     * @param array       $data     Extra payload (ids, numbers, etc.)
     * @param string|null $userId   Null = broadcast to all shop users
     */
    public static function send(
        string $shopId,
        string $type,
        string $title,
        ?string $message = null,
        array $data = [],
        ?string $userId = null
    ): Notification {
        // Always save to DB first — this is the source of truth
        $notification = Notification::create([
            'id'         => Str::uuid(),
            'shop_id'    => $shopId,
            'user_id'    => $userId,
            'type'       => $type,
            'title'      => $title,
            'message'    => $message,
            'data'       => $data ?: null,
            'created_at' => now(),
        ]);

        // Broadcast via Reverb — best-effort, never breaks the main request
        try {
            broadcast(new NotificationEvent(
                shopId:         $shopId,
                notificationId: $notification->id,
                type:           $type,
                title:          $title,
                message:        $message,
                data:           $data ?: null,
                createdAt:      $notification->created_at->toIso8601String(),
            ))->toOthers();
        } catch (\Throwable $e) {
            Log::warning("NotificationService: broadcast failed (Reverb may be offline): {$e->getMessage()}");
        }

        return $notification;
    }
}
