<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Private shop channel — allow any authenticated user belonging to that shop
Broadcast::channel('shop.{shopId}', function ($user, $shopId) {
    return $user->shop_id === $shopId;
});
