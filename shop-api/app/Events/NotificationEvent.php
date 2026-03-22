<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public readonly string $shopId,
        public readonly string $notificationId,
        public readonly string $type,
        public readonly string $title,
        public readonly ?string $message,
        public readonly ?array $data,
        public readonly string $createdAt,
    ) {
    }

    /**
     * Get the channels the event should broadcast on.
     * Private channel per shop so only users of that shop receive it.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("shop.{$this->shopId}"),
        ];
    }

    /**
     * The event name shown on the client.
     */
    public function broadcastAs(): string
    {
        return 'notification';
    }

    /**
     * Data broadcasted to the client.
     */
    public function broadcastWith(): array
    {
        return [
            'id'         => $this->notificationId,
            'type'       => $this->type,
            'title'      => $this->title,
            'message'    => $this->message,
            'data'       => $this->data,
            'read_at'    => null,
            'created_at' => $this->createdAt,
        ];
    }
}
